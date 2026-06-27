cat <<EOF > ~/.bash_aliases
alias reboot-uefi='systemctl reboot --firmware-setup'
alias cls='clear'
alias upgrade='sudo apt update && sudo apt upgrade'
alias apt-upgrade='sudo apt update && sudo apt upgrade'
alias apt-clean='sudo apt clean && sudo apt autoremove'
alias sys-upgrade='sudo do-release-upgrade'
alias gedit='gnome-text-editor'
alias ged='gnome-text-editor'
alias edit='gnome-text-editor'
alias jpg2avif='for i in *.jpg; do ffmpeg -hide_banner -i "\${i}" "\${i/.jpg/.avif}" && rm "\${i}"; done'
alias jpeg2avif='for i in *.jpeg; do ffmpeg -hide_banner -i "\${i}" "\${i/.jpeg/.avif}" && rm "\${i}"; done'
alias mp4tohevc='for i in *.mp4; do ffmpeg -hide_banner -i "\${i}" -c:v libx265 -crf 32 "\${i/.mp4/-HEVC.mp4}" && rm "\${i}"; done'
EOF
