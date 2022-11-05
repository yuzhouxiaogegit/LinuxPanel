# 宝塔回滚到7.7.0方法（回滚到旧版本）
1、下载离线安装包

```code 
wget https://github.com/yuzhouxiaogegit/LinuxPanel/archive/refs/heads/main.zip
 ```

 2、解压软件包

 ```code 
 unzip main.zip
 ```

 3、进入升级目录

 ``` code 
 cd /root/LinuxPanel-main/panel
 ```

 4、运行当前脚本更新

 ```code
 bash update.sh
  ```

  # 屏蔽宝塔强制绑定手机方法
  1、屏蔽绑定手机
   ```code
 sed -i "s|bind_user == 'True'|bind_user == 'XXXX'|" /www/server/panel/BTPanel/static/js/index.js
  ```
  2、直接删除宝塔强制绑定手机js文件
```code
rm -f /www/server/panel/data/bind.pl
  ```
  
 # 如果觉得麻烦，干脆就直接安装 5.9 版本或者国际版本
1、5.9版安装脚本
 ```code
 yum install -y wget && wget -O install.sh http://download.bt.cn/install/install.sh && sh install.sh
 ```
2、 国际版安装脚本
  ```code
 yum install -y wget && wget -O install.sh http://www.aapanel.com/script/install_6.0_en.sh && bash install.sh aapanel
 ```
 ### bbr加速脚本
 ```code
 wget -N --no-check-certificate "https://raw.githubusercontent.com/chiakge/Linux-NetSpeed/master/tcp.sh"
chmod +x tcp.sh
./tcp.sh
 ```
