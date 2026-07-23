#!/bin/bash

cat <<'EOF' >> /etc/grub.d/40_custom 

menuentry 'Reboot' --class restart --class os {
	reboot
}

menuentry 'Shutdown' --class shutdown --class os {
	halt
}
EOF