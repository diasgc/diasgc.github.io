cat <<-EOF > ~/.bash_aliases
alias reboot-uefi='systemctl reboot --firmware-setup'
alias cls='clear'
alias upgrade='sudo apt update && sudo apt upgrade'
alias apt-upgrade='sudo apt update && sudo apt upgrade'
alias apt-clean='sudo apt clean && sudo apt autoremove'
alias sys-upgrade='sudo do-release-upgrade'
alias gedit='gnome-text-editor'
alias ged='gnome-text-editor'
alias edit='gnome-text-editor'
alias jpg2avif='for i in *.jpg; do a=$(basename "$i"); b=${a%.*}; ffmpeg -hide_banner -i "$a" "${b}.avif" && rm "$a"; done'
alias jpeg2avif='for i in *.jpeg; do a=$(basename "$i"); b=${a%.*}; ffmpeg -hide_banner -i "$a" "${b}.avif" && rm "$a"; done'
alias mp4tohevc='for i in *.mp4; do a=$(basename "$i"); b=${a%.*}; ffmpeg -hide_banner -i "$a" -c:v libx265 -crf 32 "${b}-HEVC.mp4" && rm "$a"; done'
EOF
