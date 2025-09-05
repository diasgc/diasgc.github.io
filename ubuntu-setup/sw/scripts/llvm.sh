wget https://apt.llvm.org/llvm.sh
chmod +x llvm.sh
curr_version=$(grep -oP 'CURRENT_LLVM_STABLE=\K\d+' llvm.sh)
#sed -nE 's/CURRENT_LLVM_STABLE=([0-9]+)/\1/p' llvm.sh
v=("${curr_version} - default" "$((curr_version + 1)) - stable" "$((curr_version + 2)) - qualification" "$((curr_version + 3)) - development")
version=$(zenity --entry --title "Install LLVM" --text "Select version" --entry-text="${v[@]}" | grep -oP '\d+')
#read -p "Enter LLVM version to install (default stable is $curr_version): " version
version=${version:-$curr_version}
sudo ./llvm.sh $version all
rm llvm.sh