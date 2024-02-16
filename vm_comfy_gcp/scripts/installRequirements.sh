sudo apt-get update
sudo apt-get --assume-yes upgrade
sudo apt-get --assume-yes install software-properties-common
sudo apt-get --assume-yes install jq
sudo apt-get --assume-yes install build-essential
sudo apt-get --assume-yes install linux-headers-$(uname -r)
wget https://repo.anaconda.com/miniconda/Miniconda3-py310_23.11.0-2-Linux-x86_64.sh
chmod +x Miniconda3-py310_23.11.0-2-Linux-x86_64.sh
./Miniconda3-py310_23.11.0-2-Linux-x86_64.sh -b -p $HOME/miniconda3
~/miniconda3/bin/conda init bash
source .bashrc
source .bashrc
# confirm GPU is attached
lspci | grep -i nvidia

pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
echo -e "import torch\nprint(torch.cuda.is_available())\nprint(torch.cuda.get_device_name(0))" > test_cuda.py
python test_cuda.py