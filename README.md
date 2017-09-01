# station-iso
This project builds wisnuc station installation iso image.

It requires Ubuntu server amd64 version. The latest 16.04 LTS is officially supported. Other versions are not tested.

# Usage

0, Prerequisite

`xorriso` is required for building hybrid (with UEFI) iso image.
```
$ sudo apt install xorriso
```

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

# Trouble-shooting

To check if an iso is a flat iso9660, a hybrid, with or without UEFI support, use `fdisk` command.

```
$ fdisk -l ubuntu-16.04.3-server-amd64.iso
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x40b1aa35

Device                           Boot  Start     End Sectors  Size Id Type
ubuntu-16.04.3-server-amd64.iso1 *         0 1689599 1689600  825M  0 Empty
ubuntu-16.04.3-server-amd64.iso2      426064  430735    4672  2.3M ef EFI (FAT-12/16/32)

$ fdisk -l ubuntu-16.04.3-server-amd64-wisnuc-station-0.8.7.iso
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x4411db41

Device                                                Boot Start     End Sectors  Size Id Type
ubuntu-16.04.3-server-amd64-wisnuc-station-0.8.7.iso1 *        0 1763327 1763328  861M  0 Empty
ubuntu-16.04.3-server-amd64-wisnuc-station-0.8.7.iso2       7880   12551    4672  2.3M ef EFI (FAT-12/16/32)
```

# Help

File a issue for question, feature request, or bug report.

# Reference

1. https://help.ubuntu.com/community/InstallCDCustomization
2. http://www.syslinux.org/wiki/index.php?title=Isohybrid
3. https://linuxconfig.org/legacy-bios-uefi-and-secureboot-ready-ubuntu-live-image-customization
4. https://askubuntu.com/questions/342365/what-is-the-difference-between-grubx64-and-shimx64

There is no isohdpfx.bin provided in ubuntu iso. It must be cut from iso image. See isohybrid documentation.