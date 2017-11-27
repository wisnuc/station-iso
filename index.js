const Promise = require('bluebird')
const path = require('path')
const fs = Promise.promisifyAll(require('fs'))
const child = Promise.promisifyAll(require('child_process'))
const request = require('superagent')

const { log } = console

// core function
// 1. if string, run it with child.spawn
// 2. if sync function, it is invoked to generate command line, aka, lazy
// 3. if async function, it is invoked with await
// 4. if array, then all entries are paralleled with promise.all
const spawnCommandAsync = async command => {
  if (typeof command === 'string') {
    return new Promise((resolve, reject) => {
      let cmds = command.trim().split(' ').filter(x => x.length > 0)
      let finished = false
      log(':: ', command)  
      let spawn = child.spawn(cmds[0], cmds.slice(1), { stdio: 'inherit' })
      spawn.on('error', err => (finished = true, reject(err)))
      spawn.on('exit', (code, signal) => {
        if (finished) return
        if (code || signal) {
          reject(new Error(`${cmds[0]} exit with code ${code} and signal ${signal}`))
        } else {
          resolve()
        }
      })
    })
  } else if (typeof command === 'function') {
    if (command.constructor.name === 'AsyncFunction') {
      return command()
    } else {
      return spawnCommandAsync(command())
    }
  } else if (Array.isArray(command)) {
    if (command.par) {
      return Promise.all(command.map(cmd => spawnCommandAsync(cmd)))
    } else {
      for (let i = 0; i < command.length; i++) {
        await spawnCommandAsync(command[i])
      }
    }
  }
}

// stamp par on array (for parallel)
const par = array => (array.par = true, array)

// global variable
let release

// constant
const addr = 'https://raw.githubusercontent.com'
const updateUrl = `${addr}/wisnuc/appifi-bootstrap-update/release/appifi-bootstrap-update.packed.js`
const bootstrapUrl = `${addr}/wisnuc/appifi-bootstrap/release/appifi-bootstrap.js.sha1`
// const nodeUrl = 'https://nodejs.org/dist/v8.4.0/node-v8.4.0-linux-x64.tar.xz'
const nodeUrl = 'https://nodejs.org/dist/v8.6.0/node-v8.6.0-linux-x64.tar.xz'
const kdeb = 'linux-image-4.3.3.001+_001_amd64.deb'

// mandatory arg
const iso = process.argv.find(arg => arg.endsWith('.iso'))
// optional arg (-v)
const version = process.argv.find((arg, index, array) => (index !== 0 && array[index - 1] === '-v'))

if (!iso) {
  log('please provide iso file path')
  process.exit(1)
}

// retrieve release object
const retrieveAsync = async () => {
  let releases = await new Promise((resolve, reject) => request
    .get('https://api.github.com/repos/wisnuc/appifi-release/releases')
    .end((err, res) => err ? reject(err) : resolve(res.body)))

  if (version) {
    release = releases.find(rel => rel.tag_name === version)
    if (!release) {
      log('version not found')
      process.exit(1)
    }
  } else {
    if (releases.length === 0) {
      log('no available release')
      process.exit(1)
    }
    release = releases[0] 
  }
}

// volume id for iso image
const volumeId = () => (/^ubuntu-[0-9]{2}.[0-9]{2}(.[0-9])?-server-amd64.iso$/.test(iso)) 
  ? `ubuntu-${iso.length === 29 ? iso.substring(7, 12) : iso.substring(7, 14)}-wisnuc` 
  : `ubuntu-wisnuc`

// output iso file name
const output = () => path.basename(iso, '.iso') + `-wisnuc-station-${release.tag_name}.iso`

// repacked tarball file name
const repacked = () => `appifi-${release.tag_name}-${release.id}-${release.target_commitish.slice(0,8)}-${(release.prerelease ? 'pre' : 'rel')}.tar.gz`

// append to ubuntu-server.seed
const seed = () => ` 
# Individual additional packages to install
d-i pkgsel/include string avahi-daemon avahi-utils btrfs-tools imagemagick ffmpeg samba udisks2 libimage-exiftool-perl
# Install wisnuc files
d-i preseed/late_command string \\
mkdir -p /target/wisnuc/appifi-tarballs; \\
mkdir -p /target/wisnuc/bootstrap; \\
cp /cdrom/wisnuc/${repacked()} /target/wisnuc/appifi-tarballs; \\
cp /cdrom/wisnuc/appifi-bootstrap-update.packed.js /target/wisnuc/bootstrap; \\
cp /cdrom/wisnuc/appifi-bootstrap.js.sha1 /target/wisnuc/bootstrap; \\
cp /cdrom/wisnuc/appifi-bootstrap-update.service /target/lib/systemd/system; \\
cp /cdrom/wisnuc/appifi-bootstrap-update.timer /target/lib/systemd/system; \\
cp /cdrom/wisnuc/appifi-bootstrap.service /target/lib/systemd/system; \\
cp /cdrom/wisnuc/${nodeUrl.split('/').pop()} /target; \\
in-target tar xJf ${nodeUrl.split('/').pop()} -C /usr --strip-components=1; \\
rm -rf /target/${nodeUrl.split('/').pop()}; \\
in-target systemctl stop smbd nmbd; \\
in-target systemctl disable smbd nmbd; \\
in-target systemctl enable appifi-bootstrap; \\
in-target systemctl enable appifi-bootstrap-update.timer`

// series
spawnCommandAsync([
  retrieveAsync,
  'rm -rf tmp iso cd-image',
  'mkdir -p tmp iso cd-image/wisnuc',
  `mount -o loop ${iso} iso`,
  'cp -rT iso cd-image',
  'umount iso',
  'chmod a+w cd-image/preseed/ubuntu-server.seed',
  'chmod a+w cd-image/isolinux/isolinux.bin',
  'cp assets/appifi-bootstrap-update.service cd-image/wisnuc',
  'cp assets/appifi-bootstrap-update.timer cd-image/wisnuc',
  'cp assets/appifi-bootstrap.service cd-image/wisnuc',
  'cp assets/install_ws215i.sh cd-image/wisnuc',
  `cp assets/${kdeb}.orig cd-image/wisnuc/${kdeb}`,
  `wget -O cd-image/wisnuc/${nodeUrl.split('/').pop()} ${nodeUrl}`,
  `wget -O cd-image/wisnuc/appifi-bootstrap-update.packed.js ${updateUrl}`,
  `wget -O cd-image/wisnuc/appifi-bootstrap.js.sha1 ${bootstrapUrl}`,
  () => `wget -O cd-image/wisnuc/appifi-${release.tag_name}-orig.tar.gz ${release.tarball_url}`,
  () => `tar xzf cd-image/wisnuc/appifi-${release.tag_name}-orig.tar.gz -C tmp --strip-components=1`,  
  async () => (log('write tmp/.release.json'), fs.writeFileAsync('tmp/.release.json', JSON.stringify(release, null, '  '))),
  async () => (log('write cd-image/.release.json'), fs.writeFileAsync('cd-image/.release.json', JSON.stringify(release, null, '  '))),
  () => `tar czf cd-image/wisnuc/${repacked()} -C tmp .`,
  async () => (log('append ubuntu-server.seed'), log(seed()), fs.writeFileAsync('cd-image/preseed/ubuntu-server.seed', seed(), { flag: 'a' })),

  /** flat iso9660
  () => `mkisofs -r \
    -V ${volumeId()} \
    -cache-inodes -J -l \
    -b isolinux/isolinux.bin \
    -c isolinux/boot.cat \
    -no-emul-boot \
    -boot-load-size 4 \
    -boot-info-table \
    -o ${output()} cd-image`,
  */

  /** hybrid with UEFI support
    1. --isohybrid-mbr requires path relative to working directory, not cd-image
    2. -no-emul-boot must be provided to -eltorito-alt-boot, otherwise xorriso complains with 2.3M efi.img size
  */ 
  () => `dd if=${iso} bs=512 count=1 of=cd-image/isolinux/isohdpfx.bin`,
  () => `xorriso -as mkisofs -r \
    -V ${volumeId()} \
    -o ${output()} \
    -isohybrid-mbr cd-image/isolinux/isohdpfx.bin \
    -cache-inodes -J -l \
    -c isolinux/boot.cat \
    -b isolinux/isolinux.bin \
      -no-emul-boot -boot-load-size 4 -boot-info-table \
    -eltorito-alt-boot \
    -e boot/grub/efi.img \
      -no-emul-boot -isohybrid-gpt-basdat \
    cd-image`,

]).then(x => x, e => console.log(e))


