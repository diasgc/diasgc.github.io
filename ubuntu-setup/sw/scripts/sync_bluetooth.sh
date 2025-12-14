#!/bin/sh
# source: https://gist.github.com/alexkuz/9beb6ddba835f73d2215f9819f18fff5
#
# usage: ./sync_bluetooth.sh [media_path]
# usage: DRY_RUN=1 ./sync_bluetooth.sh [media_path]  # to preview changes without applying
#
# Description:
# Sync Bluetooth pairing keys from Windows registry to Linux Bluetooth config
# Requires chntpw package to read Windows registry files
#

MEDIA_PATH=${1:-/media}
KEYS_PATH=ControlSet001\\Services\\BTHPORT\\Parameters\\Keys
BT_CONFIG_PATH=/var/lib/bluetooth

# =============== Utils ===============

find_sys32() {
	while [ "$#" -gt 0 ]; do
	    current="$1"
	    shift

	    win_dir="$current/Windows"
	    sys32_dir="$win_dir/System32"

	    if [ -d "$sys32_dir" ]; then
	        echo "$sys32_dir"
	        exit 0
	    fi

	    if [ -r "$current" ] && [ -x "$current" ]; then
	        for sub in "$current"/*; do
	            if [ -d "$sub" ] && [ -x "$sub" ]; then
	                # Append to the end of the queue
	                set -- "$@" "$sub"
	            fi
	        done
	    fi
	done
	exit 1
}

exec_reg_command() {
	REG_PATH=$1
	CMD=$2

	chntpw -e "$REG_PATH" << EOF
$CMD
q
EOF
}

list_reg_keys() {
	REG_PATH=$1
	KEY_PATH=$2

	OUTPUT=$(exec_reg_command "$REG_PATH" "ls $KEY_PATH")

	echo "$OUTPUT" | awk '
  BEGIN { in_keys = 0 }
  /  key name/ { in_keys = 1; next }
  in_keys {
    if ($0 ~ /^([[:space:]]*|[[:space:]]*size[[:space:]].*)$/) exit
    if ($0 ~ /<.*>/) {
      gsub(/[<>[:space:]]/, "", $0)
      print $0
    }
  }
'
}

read_reg_value() {
	REG_PATH=$1
	KEY_PATH=$2

	OUTPUT=$(exec_reg_command "$REG_PATH" "hex $KEY_PATH")

	echo "$OUTPUT" | awk '
	/^(> )?Value .* \[0x[0-9a-fA-F]+\]$/ {
	  match($0, /\[0x[0-9a-fA-F]+\]/)
	  hexlen = substr($0, RSTART+3, RLENGTH-4)
	  bytelen = strtonum("0x" hexlen)
	  getline
	  # Extract hex bytes from column 2 onward
	  n = split($0, fields)
	  hex = ""
	  count = 0
	  for (i = 2; i <= n && count < bytelen; i++) {
	    if (fields[i] ~ /^[0-9A-Fa-f]{2}$/) {
	      hex = hex fields[i]
	      count++
	    }
	  }
	  print hex
	  exit
	}
'
}

mac_to_hex() {
	echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d ':'
}

hex_to_mac() {
  echo "$1" | sed 's/../&:/g;s/:$//' | tr '[:lower:]' '[:upper:]'
}

find_matching_keys() {
	KEYS=$1
	BT_DEVICES=$2
	for KEY in $KEYS; do
		KEY_PREFIX=$(echo "$KEY" | cut -c1-10)
	  for BT in $BT_DEVICES; do
	  	BT_CLEAN=$(mac_to_hex "$BT" | cut -c1-10)
	    if [ "$KEY_PREFIX" = "$BT_CLEAN" ]; then
	      echo "${KEY}_${BT}"
	    fi
	  done
	done
}

reverse_hex_bytes() {
	while read -r HEX; do
	  echo "$HEX" | sed 's/../& /g' | awk '{
	    for (i=NF; i>=1; i--) printf "%s", $i;
	    print "";
	  }'
	done
}

reverse_mac_bytes() {
	while read -r MAC; do
	  echo "$MAC" | awk -F: '{
	    for (i=NF; i>=1; i--) {
	      printf "%s", toupper($i);
	      if (i > 1) printf ":";
	    }
	    print "";
	  }'
	done
}

hex_to_dec() {
	while read -r HEX; do
		awk "BEGIN { printf \"%0.f\n\", 0x$HEX }"
	done
}

dec_to_hex() {
	while read -r DEC; do
		printf "%x\n" "$DEC"
	done
}

read_from_config() {
  FILE="$1"
  SECTION="$2"
  key="$3"

  sudo awk -v target_section="$SECTION" -v target_key="$key" '
  BEGIN { in_section=0 }
  {
    if ($0 == target_section) {
      in_section=1
      next
    }
    if (in_section) {
      if ($0 ~ /^\[.*\]$/) {
        in_section=0
        next
      }
      if ($0 ~ "^" target_key "=") {
        split($0, parts, "=")
        print parts[2]
        exit
      }
    }
  }
  ' "$FILE"
}

write_to_config() {
  FILE="$1"
  SECTION="$2"
  KEY="$3"
  VALUE="$4"

  # Use a temporary file for safe in-place editing
  TMP_FILE=$(mktemp) || exit 1

  TEXT=$(sudo awk -v target_section="$SECTION" -v target_key="$KEY" -v new_value="$VALUE" '
    BEGIN { 
        in_target_section = 0
        found_section = 0
        key_found = 0
        key_added = 0
    }
    
    # Match section headers
    /^\[.*\]$/ {
        # If we were in target section and key wasnt found/added, add it now
        if (in_target_section && !key_found && !key_added) {
            print target_key "=" new_value
            key_added = 1
        }
        
        # Check if this is our target section
        if ($0 == target_section) {
            in_target_section = 1
            found_section = 1
        } else {
            in_target_section = 0
        }
        print $0
        next
    }
    
    # Process lines within sections
    {
        if (in_target_section) {
            # Check if this is an empty line and we need to add the key
            if ($0 == "" && !key_found && !key_added) {
                print target_key "=" new_value
                key_added = 1
                print $0
            }
            # Check if line contains a key=value pair
            else if (match($0, /^[^=]+=/)) {
                # Extract key (everything before first =)
                split($0, parts, "=")
                line_key = parts[1]
                
                if (line_key == target_key) {
                    # Replace the value
                    print target_key "=" new_value
                    key_found = 1
                    key_added = 1
                } else {
                    print $0
                }
            } else {
                print $0
            }
        } else {
            print $0
        }
    }
    
    END {
        # If we found the section but never added the key, add it at the end
        if (found_section && !key_added) {
            print target_key "=" new_value
        }
        
        # Set exit code based on whether section was found
        if (!found_section) {
            exit 1
        }
    }
  ' "$FILE")

  echo "$TEXT" > "$TMP_FILE"
  echo "$SECTION: setting $KEY=$VALUE"

  if [ -z "$DRY_RUN" ]; then
    sudo mv "$TMP_FILE" "$FILE"
    sudo chown root:root "$FILE"
  else
    rm "$TMP_FILE"
  fi
}

select_device_key() {
	DEVICE_KEYS=$1
	BT_HOST_CONFIG_PATH=$2
  echo "Matching devices:"
  echo "================="
  
  # Convert space-separated string to indexed list
  i=1
  for KEY in $DEVICE_KEYS; do
  		HEX=$(echo "$KEY" | cut -d "_" -f 1)
  		MAC=$(echo "$KEY" | cut -d "_" -f 2)
			DEVICE_NAME=$(read_from_config "$BT_HOST_CONFIG_PATH/$MAC/info" "[General]" "Name")
      echo "$i) $DEVICE_NAME ($HEX => $MAC)"
      i=$((i + 1))
  done
  
  if [ $((i - 1)) -gt 1 ]; then
    printf "Please select a device (1-%d) [1]: " $((i - 1))
  else
    printf "Please select a device [1]: "
  fi
  read -r choice

  if [ -z "$choice" ]; then
    choice="1"
  fi
  
  # Validate input
  if ! echo "$choice" | grep -q '^[0-9]\+$'; then
      echo "Error: Please enter a valid number."
      return 1
  fi
  
  if [ "$choice" -lt 1 ] || [ "$choice" -ge "$i" ]; then
      echo "Error: Please enter a number between 1 and $((i - 1))."
      return 1
  fi
  
  # Get the selected key
  j=1
  for KEY in $DEVICE_KEYS; do
      if [ "$j" -eq "$choice" ]; then
          SELECTED_KEY="$KEY"
          break
      fi
      j=$((j + 1))
  done
  
  echo "You selected: $(echo "$SELECTED_KEY" | cut -d " " -f 1)"
  return 0
}

save_backup() {
  FILE=$1
  if [ -z "$DRY_RUN" ]; then
     sudo cp "$FILE" "$FILE.backup"
     echo "Backup saved to $FILE.backup"
  fi
}

# =============== Script starts here ===============

WINDOWS_SYS32_PATH=$(find_sys32 "$MEDIA_PATH")

if [ -z "$WINDOWS_SYS32_PATH" ]; then
  echo "No Windows registry directories found in $MEDIA_PATH"
  echo "Check that Windows volume is mounted"
  exit 1
fi

SYSTEM_PATH="$WINDOWS_SYS32_PATH/config/SYSTEM"

if ! command -v chntpw > /dev/null; then
	apt install chntpw
fi

echo "Accessing $SYSTEM_PATH..."
echo ""

KEYS=$(list_reg_keys "$SYSTEM_PATH" "$KEYS_PATH")

if ! sudo -n true 2>/dev/null; then
  echo "Note: We need elevated privileges to read Bluetooth data from /var/lib/bluetooth."
fi

HOST_MACS=$(sudo ls "$BT_CONFIG_PATH")

MATCHING_PAIRS=$(find_matching_keys "$KEYS" "$HOST_MACS")

if [ -z "$MATCHING_PAIRS" ]; then
	echo "No host matches found :("
	exit 1
fi

HOST_HEX=$(echo "$MATCHING_PAIRS" | head -1 | cut -d "_" -f 1)
HOST_MAC=$(echo "$MATCHING_PAIRS" | head -1 | cut -d "_" -f 2)

echo "Found matching host MAC: $HOST_MAC ($HOST_HEX)"

BT_DEVICE_KEYS=$(list_reg_keys "$SYSTEM_PATH" "$KEYS_PATH\\$HOST_HEX")

BT_HOST_CONFIG_PATH="$BT_CONFIG_PATH/$HOST_MAC"

BT_DEVICES=$(sudo ls "$BT_HOST_CONFIG_PATH")

MATCHING_PAIRS=$(find_matching_keys "$BT_DEVICE_KEYS" "$BT_DEVICES")

if [ -z "$MATCHING_PAIRS" ]; then
	echo "No device matches found :("
	exit 1
fi

if ! select_device_key "$MATCHING_PAIRS" "$BT_HOST_CONFIG_PATH"; then
	echo "No suitable device were selected, quitting..."
	exit 0
fi

BT_DEVICE_HEX=$(echo "$SELECTED_KEY" | cut -d "_" -f 1)
OLD_BT_DEVICE_MAC=$(echo "$SELECTED_KEY" | cut -d "_" -f 2)

DEVICE_NAME=$(read_from_config "$BT_HOST_CONFIG_PATH/$OLD_BT_DEVICE_MAC/info" "[General]" "Name")
echo "Found matching device: $BT_DEVICE_HEX => $OLD_BT_DEVICE_MAC ($DEVICE_NAME)"

BT_DEVICE_MAC=$(hex_to_mac "$BT_DEVICE_HEX")

BT_DEVICE_CONFIG_PATH="$BT_HOST_CONFIG_PATH/$BT_DEVICE_MAC"
OLD_BT_DEVICE_CONFIG_PATH="$BT_HOST_CONFIG_PATH/$OLD_BT_DEVICE_MAC"

if ! [ "$OLD_BT_DEVICE_MAC" = "$BT_DEVICE_MAC" ]; then
  if [ -z "$DRY_RUN" ]; then
  	sudo cp -r "$OLD_BT_DEVICE_CONFIG_PATH" "$BT_DEVICE_CONFIG_PATH"
  else
    BT_DEVICE_CONFIG_PATH=$OLD_BT_DEVICE_CONFIG_PATH
  fi
fi

INFO_FILE="$BT_DEVICE_CONFIG_PATH/info"

DEVICE_REG_PATH="$KEYS_PATH\\$HOST_HEX\\$BT_DEVICE_HEX"

ERAND=$(read_reg_value "$SYSTEM_PATH" "$DEVICE_REG_PATH\\ERand")
LTK=$(read_reg_value "$SYSTEM_PATH" "$DEVICE_REG_PATH\\LTK")
EDIV=$(read_reg_value "$SYSTEM_PATH" "$DEVICE_REG_PATH\\EDIV")
IRK=$(read_reg_value "$SYSTEM_PATH" "$DEVICE_REG_PATH\\IRK")

case "$DEVICE_NAME" in
  # ===========================================================================
	# Add your device here
  # See https://wiki.archlinux.org/title/Bluetooth#Preparing_Bluetooth_5.1_Keys
  # for instructions for your device
  # ===========================================================================

	"Logitech Pebble")

    save_backup "$INFO_FILE"
		write_to_config "$INFO_FILE" "[IdentityResolvingKey]" "Key" "$(echo "$IRK" | reverse_hex_bytes)"
		write_to_config "$INFO_FILE" "[LongTermKey]" "Key" "$LTK"
		write_to_config "$INFO_FILE" "[LongTermKey]" "EDiv" "$(echo "$EDIV" | reverse_hex_bytes | hex_to_dec)"
		write_to_config "$INFO_FILE" "[LongTermKey]" "Rand" "$(echo "$ERAND" | reverse_hex_bytes | hex_to_dec)"

		;;

	*)
		echo "Unknown device: $DEVICE_NAME"
		exit 1
		;;
esac

if [ -z "$DRY_RUN" ]; then
  echo "Restarting bluetooth service..."
  sudo systemctl restart bluetooth

  if ! [ "$OLD_BT_DEVICE_CONFIG_PATH" = "$BT_DEVICE_CONFIG_PATH" ]; then
    echo "Device configuration was moved from $OLD_BT_DEVICE_CONFIG_PATH to $BT_DEVICE_CONFIG_PATH."
    printf "Do you want to remove old configuration? [Y/n]"
    read -r input
    if [ -z "$input" ] || [ "$input" = "y" ] || [ "$input" = "Y" ]; then
      echo "Removing old configuration files..."
      sudo rm -rf "$OLD_BT_DEVICE_CONFIG_PATH"
    fi
  fi
fi
