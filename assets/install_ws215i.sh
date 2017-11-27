#!/bin/bash

set -e

# install 4.3.3 kernel
dpkg -i linux-image-4.3.3.001+_001_amd64.deb

# remove old kernels, hold generic packages
apt-get -y remove linux-image-4.4
apt-get -y remove linux-headers-4.4
apt-get -y remove linux-image-generic
apt-get -y remove linux-headers-generic
apt-mark hold linux-image-generic
apt-mark hold linux-headers-generic
update-initramfs -u -k all

# create ws215i specific link for kexec in on-board flash
cd /boot
ln -s vmlinuz-4.3.3.001+ bzImage
ln -s initrd.img-4.3.3.001+ ramdisk
echo "console=tty0 console=ttyS0,115200 root=/dev/mmcblk0p1 rootwait" > cmdline
cd -

# set systemd networking
cat <<EOF > /etc/systemd/network/wired.network
[Match]
Name=en*
[Network]
DHCP=ipv4
EOF
systemctl enable systemd-networkd
systemctl enable systemd-resolved

# set fstab
echo "/dev/mmcblk0p1 / ext4 errors=remount-ro 0 1" > /etc/fstab

# apt
# apt-update
# apt-upgrade 

# clean up
apt-get clean

rm linux-image-4.3.3.001+_001_amd64.deb
 
echo "done"
