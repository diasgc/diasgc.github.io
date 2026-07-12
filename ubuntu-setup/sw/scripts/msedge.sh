# checked on 2026-04-28
#curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/microsoft-edge.gpg
#printf '%s\n' \
#'Types: deb' \
#'URIs: https://packages.microsoft.com/repos/edge' \
#'Suites: stable' \
#'Components: main' \
#'Signed-By: /usr/share/keyrings/microsoft-edge.gpg' \
#'Architectures: amd64' |
#sudo tee /etc/apt/sources.list.d/microsoft-edge.sources > /dev/null

deb="packages-microsoft-prod.deb"
rel="$(lsb_release -rs)"
wget -q "https://packages.microsoft.com/config/ubuntu/${rel}/${deb}" && \
sudo dpkg -i ${deb} && rm ${deb} && sudo apt update && sudo apt install microsoft-edge-stable