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
