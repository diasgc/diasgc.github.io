# checked on 2026-04-28
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/microsoft-edge.gpg
printf '%s\n' \
'Types: deb' \
'URIs: https://packages.microsoft.com/repos/edge' \
'Suites: stable' \
'Components: main' \
'Signed-By: /usr/share/keyrings/microsoft-edge.gpg' \
'Architectures: amd64' |
sudo tee /etc/apt/sources.list.d/microsoft-edge.sources > /dev/null

# osv="$(lsb_release -r | grep -oP "[0-9.]+")"
# wget "https://packages.microsoft.com/config/ubuntu/${osv}/packages-microsoft-prod.deb" -O packages-microsoft-prod.deb
# sudo dpkg -i packages-microsoft-prod.deb
# rm packages-microsoft-prod.deb