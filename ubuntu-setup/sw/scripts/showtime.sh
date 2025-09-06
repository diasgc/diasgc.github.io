v=$(gnome-shell --version | grep -oP '\d\d')
if [ "$v" -gt 47 ]; then
    sudo apt install showtime -y
else
    clear
    test -z "$(command -v flatpak)" && sudo apt install flatpak
    flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
    flatpak install flathub org.gnome.Showtime
    echo -e "\n\n\e[33mDone! Please reboot to take effect\e[0m"
fi
