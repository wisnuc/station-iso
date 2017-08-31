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

# Help

File a issue for question, feature request, or bug report.

