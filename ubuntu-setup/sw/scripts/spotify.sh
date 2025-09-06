echo -e "\e[32mAdding Spotify repository\e[2m"
curl -sS https://download.spotify.com/debian/pubkey_C85668DF69375001.gpg | sudo gpg --dearmor --yes -o /etc/apt/trusted.gpg.d/spotify.gpg
echo "deb https://repository.spotify.com stable non-free" | sudo tee /etc/apt/sources.list.d/spotify.list

echo -e "\e[32mUpdating package list and installing Spotify\e[2m"
sudo apt update
sudo apt install spotify-client
# Clean up
sudo apt clean
sudo apt autoremove -y
echo -e "\e[32mSpotify installation complete\e[0m"