cat <<'EOF' > ~/.bash_aliases
alias reboot-uefi='systemctl reboot --firmware-setup'
alias cls='clear'
alias upgrade='sudo apt update && sudo apt upgrade'
alias apt-upgrade='sudo apt update && sudo apt upgrade'
alias apt-clean='sudo apt clean && sudo apt autoremove'
alias sys-upgrade='sudo do-release-upgrade'
alias gedit='gnome-text-editor'
alias ged='gnome-text-editor'
alias edit='gnome-text-editor'

function git-config(){
    p=($(zenity --forms --text="Git Config" --add-entry="email" --add-entry="username" --add-combo="Scope" --combo-values="Local|Global" --separator=" "))
    test -z "${p[0]}" && echo "Email is required." && return 1
    test -z "${p[1]}" && echo "Username is required." && return 1
    case "${p[2],,}" in
        local)  git config user.email "${p[0]}" && git config user.name "${p[1]}" ;;
        global) git config --global user.email "${p[0]}" && git config --global user.name "${p[1]}" ;;
    esac
    echo "Git config updated."
}

function ffmpeg-avif() {
    test -z "$1" && echo "Usage: ffmpeg-avif [-r remove original file] [<quality>] <file1> [file2 ...]" && return 1
    case "$1" in -r) rem=y; shift ;; esac
    test -n "$(grep -oP "\d+" <<<"${1}")" && args+=(-crf "${1}") && shift
    args=(-c:v libaom-av1 -crf ${qual:-28})
    for i in "$@"; do
        ffmpeg -hide_banner -i "${i}" "${args[@]}" "${i/.*/.avif}" && case "${rem,,}" in y) rm "${i}" ;; esac
    done
}

function ffmpeg-hevc() {
    test -z "$1" && echo "Usage: ffmpeg-hevc [-r remove original file] [<quality>] <file1> [file2 ...]" && return 1
    case "$1" in -r) rem=y; shift ;; esac
    test -n "$(grep -oP "\d+" <<<"${1}")" && args+=(-crf "${1}") && shift
    args=(-c:v libx265 -crf ${qual:-28})
    for i in "$@"; do
        ffmpeg -hide_banner -i "${i}" "${args[@]}" "${i/.*/-HEVC.mp4}" && case "${rem,,}" in y) rm "${i}" ;; esac
    done
}

function ffmpeg-cut() {
    test -z "$1" && echo "Usage: ffmpeg-cut [-r remove original file] <start_time>[-<end_time>] <file1> [file2 ...]" && return 1
    case "$1" in -r) rem=y; shift ;; esac
    IFS='-' read -ra c <<< "$1"; shift
    args=(-c copy)
    test -n "$(grep -oP "\d{2}:\d{2}" <<<"${c[0]}")" && args+=(-ss "${c[0]}")
    test -n "$(grep -oP "\d{2}:\d{2}" <<<"${c[1]}")" && args+=(-to "${c[1]}")
    for i in "$@"; do
        ffmpeg -hide_banner -i "${i}" "${args[@]}" "${i/.*/-cut.mp4}" && case "${rem,,}" in y) rm "${i}" ;; esac
    done
}

function ff-showtags() {
    test -z "$1" && echo "Usage: ff-showtags <file>" && return 1
    ffprobe -show_entries format_tags -show_entries stream_tags "$1"
}

echo -e "Extra functions added to your shell:

  \e[1;92malias      :\e[0;2m reboot-uefi, cls, upgrade/apt-upgrade, apt-clean, sys-upgrade, gedit/ged/edit\e[0m
  
  \e[1;92mgit-config :\e[0;2m Configure Git user email and username via GUI.\e[0m
  \e[1;92mffmpeg-avif:\e[0;2m Convert images to AVIF format using ffmpeg.\e[0m
  \e[1;92mffmpeg-hevc:\e[0;2m Convert videos to HEVC format using ffmpeg.\e[0m
  \e[1;92mffmpeg-cut :\e[0;2m Cut videos using ffmpeg.\e[0m
  \e[1;92mff-showtags:\e[0;2m Show metadata tags of media files using ffprobe.\e[0m
  "
EOF
