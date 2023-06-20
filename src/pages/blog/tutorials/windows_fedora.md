---
layout: ../../../layouts/BlogLayout.astro
title: "Windows Broke my Fedora Again!"
description: "Mom! Windows Broke my Fedora Again! For when Windows Update breaks Fedora by removing Fedora from the boot menu."
---

# Mom! Windows Broke my Fedora Again!

> Currently applies to Fedora 37 and 38.
> This guide may or may not hold in the future.

Let's set the scene, you've gotten out of bed, gotten a nice cup of tea
(or whatever your choice of beverage is), and you turn on ye olde electric
brain box.
You dual boot Windows with Fedora, and the night before, you just updated your
Windows install.
After your system boots, you see an unexpected, but familiar screen.

"Wait, where'd my beautiful Linux desktop go?" you wonder.

## Step 1: Live Environment

You reboot and mash f1, f12, or whatever key takes you to the boot menu.
However, Fedora is nowhere to be seen.
But don't fret, you used to be an arch *(btw)* user.
You've already broken your computer more times than you can count, so restoring
Fedora will be a piece of cake.
Right?

![Image Here](/blog/tutorials/windows_fedora/0.jpeg)

You grab your trusty USB stick, and flash it with Fedora's ISO from your Windows install.

[Balena Etcher](https://etcher.balena.io/) or [Fedora's Media Writer](https://fedoraproject.org/workstation/download/) will suffice.

Booting into the live environment, the first thing you do is check to make sure that
your EFI directory has not been tampered with.

## Step 2: Checking the EFI Directory

You need to locate your EFI partition.
Which one was that again?
Well, you use `lsblk` to find it.
Typically, it's the first partition: `/dev/sda1`, `/dev/nvme0n1p1`, etc, but you
want to be sure.

```bash
$ lsblk -f
```

Typically, the EFI partition is the small one that's formatted with FAT32.

```bash
$ su
$ mkdir -p /boot/efi
$ mount /dev/YOUR_EFI_PARTITION
$ ls /boot/efi
```

```bash
'$RECYCLE.BIN'   BOOT   EFI   loader   mach_kernel   System  'System Volume Information'
```

Looks good so far!

```bash
$ ls /boot/efi/EFI/fedora
```

```bash
BOOTIA32.CSV  gcdia32.efi  grub.cfg          grubia32.efi  mmia32.efi  shim.efi      shimx64.efi
BOOTX64.CSV   gcdx64.efi   grub.cfg.rpmsave  grubx64.efi   mmx64.efi   shimia32.efi  themes
```

Thankfully, the boot files are all in tact.
Of course, if they weren't there, you can always find backups by mounting your
root partition and looking in `/etc/grub.d/backup/boot_grub/`.

## Step 3: The Fix

Ok, the fix now is simple, you just need to add these files into the boot menu.
That's typically done with `grub2-install`, but because Fedora has secure boot support,
that won't work.
Instead, you need `efibootmgr`.

> If it's not already installed, you can install it using `dnf install -y efibootmgr`

```bash
$ efibootmgr -c -l "\EFI\fedora\shim.efi" -L fedora -d /dev/YOUR_DISK -p YOUR_PARTITION_NUMBER
```

> `-d` is the disk, referring to `/dev/sda`, `/dev/nvme0n1`, `/dev/nvme0n2`, etc.
> With this context `-p` refers to the partition number.
> For example, `/dev/sda1` would use `-d /dev/sda` and `-p 1`.

You reboot, and there it it!
Fedora's on the boot screen now!

![Image Here](/blog/tutorials/windows_fedora/1.jpeg)

> Eww, your screen is so dirty.

## Conclusion

Hey, thanks for reading.
This is the second time I've experienced this kind of breakage.
On the first time, it took me a few *hours* to work out the fix, and on the second
time it took about an hour since I'd already forgotten the fix.
I hope this fix helped you out as it did with me, and have a good day.
