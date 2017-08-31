# station-iso
This project builds wisnuc station installation iso image.

It requires Ubuntu server amd64 version. The latest 16.04 LTS is officially supported. Other versions are not tested.

# Usage

1, Clone this repository and npm install.
```
$ git clone https://github.com/wisnuc/station-iso
$ cd station-iso
$ npm i
```

2, Download Ubuntu server amd64 iso image (keep the original file name).
```
// ubuntu official release
$ wget http://releases.ubuntu.com/16.04.3/ubuntu-16.04.3-server-amd64.iso

or alternatively,

// 163.com mirror in china
$ wget http://mirrors.163.com/ubuntu-releases/16.04.3/ubuntu-16.04.3-desktop-amd64.iso
```

3, Build the iso image. `sudo` is required for it mounts iso as loop device.
```
$ sudo node index.js ubuntu-16.04.3-server-amd64.iso

or

$ sudo npm start ubuntu-16.04.3-server-amd64.iso
```

It generates an iso file named such as `ubuntu-ubuntu-16.04.3-server-amd64-wisnuc-station-0.8.1.iso`.

# Options

By default, the script pulls the latest wisnuc station release from github, including beta release.

You can specify the release `tag_name` with `-v` option. Then the specified version of wisnuc station will be included in the iso image.

Example:

```
sudo node index.js ubuntu-16.04.3-server-amd64.iso -v 0.9.1
```

# Known Issues

`wget` download is not stable. Sometimes the tarball file is incomplete. Be sure to check `.tar.gz` before using the disc. They are located at `/wisnuc` directory on disc.

# Inside

Wisnuc station requires very few packages to work: `avahi-daemon avahi-utils btrfs-tools imagemagick ffmpeg samba udisks2`.

`nodejs` version is 8.4.0. It is installed from official tarball and extracted into `/usr/bin`. If you are going to modify this location, be sure to update all systemd unit files located in `assets` directory. There are 2 service file and 1 timer file to be modified.

`docker` is not included in this version.

# Help

File a issue for question, feature request, or bug report.

