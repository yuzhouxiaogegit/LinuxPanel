var database = {
    database_table_view:function(serach){
        $('#bt_database_table').empty();
        var database_table = bt_tools.table({
            el: '#bt_database_table',
            url: '/data?action=getData',
            param: {
                table: 'databases',
                search:serach || ''
            }, //参数
            minWidth: '1000px',
            autoHeight: true,
            default: "数据库列表为空", // 数据为空时的默认提示
            column:[
                {type: 'checkbox',width: 20},
                {fid: 'name',title: '数据库名',type:'text'},
                {fid: 'username',title: '用户名',type:'text',sort:true},
                {fid:'password',title:'密码',type:'password',copy:true,eye_open:true},
                {
                    fid:'backup',
                    title: '备份',
                    width: 130,
                    template: function (row) {
                        var backup = '点击备份',
                            _class = "bt_warning";
                        if (row.backup_count > 0) backup = lan.database.backup_ok, _class = "bt_success";
                        return '<span><a href="javascript:;" class="btlink ' + _class + '" onclick="database.database_detail('+row.id+',\''+row.name+'\')">' + backup + (row.backup_count > 0 ? ('(' + row.backup_count + ')') : '') + '</a> | ' +
                            '<a href="javascript:database.input_database(\''+row.name+'\')" class="btlink">'+lan.database.input+'</a></span>';
                    }
                },
                {
                    fid: 'ps',
                    title: '备注',
                    type: 'input',
                    blur: function (row, index, ev) {
                        bt.pub.set_data_ps({
                            id: row.id,
                            table: 'databases',
                            ps: ev.target.value
                        }, function (res) {
                            layer.msg(res.msg, (res.status ? {} : {
                                icon: 2
                            }));
                        });
                    },
                    keyup: function (row, index, ev) {
                        if (ev.keyCode === 13) {
                            $(this).blur();
                        }
                    }
                },
                {
                    type: 'group',
                    title: '操作',
                    width: 220,
                    align: 'right',
                    group: [{
                        title: '管理',
                        tips:'数据库管理',
                        event: function(row) {
                            bt.database.open_phpmyadmin(row.name,row.username,row.password);
                        }
                    },{
                        title: '权限',
                        tips:'设置数据库权限',
                        event: function(row) {
                            bt.database.set_data_access(row.username);
                        }
                    },{
                        title:'工具',
                        tips:'MySQL优化修复工具',
                        event: function(row){
                            database.rep_tools(row.name);
                        }
                    },{
                        title:'改密',
                        tips:'修改数据库密码',
                        event: function(row){
                            database.set_data_pass(row.id,row.username,row.password);
                        }
                    },{
                        title:'删除',
                        tips:'删除数据库',
                        event: function(row){
                            database.del_database(row.id,row.name);
                        }
                    }]
                }
            ],
            sortParam: function (data) {
                return {
                    'order': data.name + ' ' + data.sort
                };
            },
            tootls: [{ // 按钮组
                type: 'group',
                positon: ['left', 'top'],
                list: [{
                    title: '添加数据库',
                    active: true,
                    event: function () {
                        bt.database.add_database(function (res){
                            if(res.status) database_table.$refresh_table_list(true);
                        })
                    }
                },{
                    title: 'root密码',
                    event: function () {
                        bt.database.set_root('root')
                    }
                },{
                    title: 'phpMyAdmin',
                    event: function () {
                        bt.database.open_phpmyadmin('','root', bt.config.mysql_root)
                    }
                },{
                    title: '同步所有',
                    style:{'margin-left':'30px'},
                    event: function () {
                        database.sync_to_database({type:0,data:[]},function(res){
                            if(res.status) database_table.$refresh_table_list(true);
                        })
                    }
                },{
                    title: '从服务器获取',
                    event: function () {
                        bt.database.sync_database(function (rdata) {
                            if (rdata.status) database_table.$refresh_table_list(true);
                        })
                    }
                },{
                    title: '回收站',
                    style:{
                        'position':'absolute',
                        'right':'0'
                    },
                    icon:'trash',
                    event: function () {
                        bt.recycle_bin.open_recycle_bin(6)
                    }
                }]
            },{
                type: 'batch', //batch_btn
                positon: ['left', 'bottom'],
                placeholder: '请选择批量操作',
                buttonValue: '批量操作',
                disabledSelectValue: '请选择需要批量操作的数据库!',
                selectList: [{
                    title:'同步选中',
                    url:'/database?action=SyncToDatabases&type=1',
                    paramName: 'ids', //列表参数名,可以为空
                    paramId: 'id', // 需要传入批量的id
                    th:'数据库名称',
                    beforeRequest: function(list) {
                        var arry = [];
                        $.each(list, function (index, item) {
                            arry.push(item.id);
                        });
                        return JSON.stringify(arry)
                    },
                    success: function (res, list, that) {
                        layer.closeAll();
                        var html = '';
                        $.each(list, function (index, item) {
                            html += '<tr><td>' + item.name + '</td><td><div style="float:right;"><span style="color:' + (res.status ? '#20a53a' : 'red') + '">' + res.msg + '</span></div></td></tr>';
                        });
                        that.$batch_success_table({
                            title: '批量同步选中',
                            th: '数据库名称',
                            html: html
                        });
                    }
                },{
                    title: "删除数据库",
                    url: '/database?action=DeleteDatabase',
                    load: true,
                    param: function (row) {
                        return {
                            id: row.id,
                            name: row.name
                        }
                    },
                    callback: function (that) { // 手动执行,data参数包含所有选中的站点
                        var ids = [];
                        for (var i = 0; i < that.check_list.length; i++) {
                            ids.push(that.check_list[i].id);
                        }
                        database.del_database(ids,function(param){
                            that.start_batch(param, function (list) {
                                layer.closeAll()
                                var html = '';
                                for (var i = 0; i < list.length; i++) {
                                    var item = list[i];
                                    html += '<tr><td>' + item.name + '</td><td><div style="float:right;"><span style="color:' + (item.request.status ? '#20a53a' : 'red') + '">' + item.request.msg + '</span></div></td></tr>';
                                }
                                database_table.$batch_success_table({
                                    title: '批量删除',
                                    th: '数据库名称',
                                    html: html
                                });
                                database_table.$refresh_table_list(true);
                            });
                        })
                    }
                }]
            }, { //分页显示
                type: 'page',
                positon: ['right', 'bottom'], // 默认在右下角
                pageParam: 'p', //分页请求字段,默认为 : p
                page: 1, //当前分页 默认：1
                numberParam: 'limit', //分页数量请求字段默认为 : limit
                number: 20, //分页数量默认 : 20条
                numberList: [10, 20, 50, 100, 200], // 分页显示数量列表
                numberStatus: true, //　是否支持分页数量选择,默认禁用
                jump: true, //是否支持跳转分页,默认禁用
            }]
        });  
    },
    // 同步所有
    sync_to_database: function (obj,callback) {
        bt.database.sync_to_database({ type: obj.type, ids: JSON.stringify(obj.data) }, function (rdata) {
            if (callback) callback(rdata);
        });
    },
    // 同步数据库
    database_detail: function (id, dataname, page) {
        if (page == undefined) page = '1';
        var loadT = bt.load(lan.public.the_get);
        bt.pub.get_data('table=backup&search=' + id + '&limit=5&type=1&tojs=database.database_detail&p=' + page, function (frdata) {
            loadT.close();
            frdata.page = frdata.page.replace(/'/g, '"').replace(/database.database_detail\(/g, "database.database_detail(" + id + ",'" + dataname + "',");
            if ($('#DataBackupList').length <= 0) {
                bt.open({
                    type: 1,
                    skin: 'demo-class',
                    area: '700px',
                    title: lan.database.backup_title,
                    closeBtn: 2,
                    shift: 5,
                    shadeClose: false,
                    content: "<div class='divtable pd15 style='padding-bottom: 0'><button id='btn_data_backup' class='btn btn-success btn-sm' type='button' style='margin-bottom:10px'>" + lan.database.backup + "</button><table width='100%' id='DataBackupList' class='table table-hover'></table><div class='page databackup_page'></div></div>"
                });
            }
            setTimeout(function () {
                $('.databackup_page').html(frdata.page);
                bt.render({
                    table: '#DataBackupList',
                    columns: [
                        { field: 'name', title: '文件名称' , templet: function (item) {
                                var _arry = item.name.split('/');
                                return _arry[_arry.length-1];
                            }},
                        {
                            field: 'size', title: '文件大小', templet: function (item) {
                                return bt.format_size(item.size);
                            }
                        },
                        { field: 'addtime', title: '备份时间' },
                        {
                            field: 'opt', title: '操作', align: 'right', templet: function (item) {
                                var _opt = '<a class="btlink" herf="javascrpit:;" onclick="bt.database.input_sql(\'' + item.filename + '\',\'' + dataname + '\')">恢复</a> | ';
                                _opt += '<a class="btlink" href="/download?filename=' + item.filename + '&amp;name=' + item.name + '" target="_blank">下载</a> | ';
                                _opt += '<a class="btlink" herf="javascrpit:;" onclick="bt.database.del_backup(\'' + item.id + '\',\'' + id + '\',\'' + dataname + '\')">删除</a>'
                                return _opt;
                            }
                        },
                    ],
                    data: frdata.data
                });
                $('#btn_data_backup').unbind('click').click(function () {
                    bt.database.backup_data(id, dataname, function (rdata) {
                        if (rdata.status) database.database_detail(id, dataname);
                    })
                })
            }, 100)
        });
    },
    // 备份导入》本地导入
    upload_files: function (name) {
        var path = bt.get_cookie('backup_path') + "/database/";
        bt_upload_file.open(path, '.sql,.zip,.bak', lan.database.input_up_type, function () {
            database.input_database(name);
        });
    },
    // 备份导入
    input_database: function (name) {
        var path = bt.get_cookie('backup_path') + "/database";
        bt.files.get_files(path, '', function (rdata) {
            var data = [];
            for (var i = 0; i < rdata.FILES.length; i++) {
                if (rdata.FILES[i] == null) continue;
                var fmp = rdata.FILES[i].split(";");
                var ext = bt.get_file_ext(fmp[0]);
                if (ext != 'sql' && ext != 'zip' && ext != 'gz' && ext != 'tgz' && ext != 'bak') continue;
                data.push({ name: fmp[0], size: fmp[1], etime: fmp[2], })
            }
            if ($('#DataInputList').length <= 0) {
                bt.open({
                    type: 1,
                    skin: 'demo-class',
                    area: ["600px", "500px"],
                    title: lan.database.input_title_file,
                    closeBtn: 2,
                    shift: 5,
                    shadeClose: false,
                    content: '<div class="pd15"><button class="btn btn-default btn-sm" onclick="database.upload_files(\'' + name + '\')">' + lan.database.input_local_up + '</button><div class="divtable mtb15" style="max-height:300px; overflow:auto">'
                        + '<table id="DataInputList" class="table table-hover"></table>'
                        + '</div>'
                        + bt.render_help([lan.database.input_ps1, lan.database.input_ps2, (bt.os != 'Linux' ? lan.database.input_ps3.replace(/\/www.*\/database/, path) : lan.database.input_ps3)])
                        + '</div>'
                });
            }
            setTimeout(function () {
                bt.render({
                    table: '#DataInputList',
                    columns: [
                        { field: 'name', title: lan.files.file_name },
                        {
                            field: 'etime', title: lan.files.file_etime, templet: function (item) {
                                return bt.format_data(item.etime);
                            }
                        },
                        {
                            field: 'size', title: lan.files.file_size, templet: function (item) {
                                return bt.format_size(item.size)
                            }
                        },
                        {
                            field: 'opt', title: '操作', align: 'right', templet: function (item) {
                                return '<a class="btlink" herf="javascrpit:;" onclick="bt.database.input_sql(\'' + bt.rtrim(rdata.PATH, '/') + "/" + item.name + '\',\'' + name + '\')">导入</a>  ';;
                            }
                        },
                    ],
                    data: data
                });
            }, 100)
        },'mtime')
    },
    // 工具
    rep_tools: function (db_name, res) {
        var loadT = layer.msg('正在获取数据,请稍候...', { icon: 16, time: 0 });
        bt.send('GetInfo', 'database/GetInfo', { db_name: db_name }, function (rdata) {
            layer.close(loadT)
            if (rdata.status === false) {
                layer.msg(rdata.msg, { icon: 2 });
                return;
            }
            var types = { InnoDB: "MyISAM", MyISAM: "InnoDB" };
            var tbody = '';
            for (var i = 0; i < rdata.tables.length; i++) {
                if (!types[rdata.tables[i].type]) continue;
                tbody += '<tr>\
                        <td><input value="dbtools_' + rdata.tables[i].table_name + '" class="check" onclick="database.selected_tools(null,\'' + db_name + '\');" type="checkbox"></td>\
                        <td><span style="width:220px;"> ' + rdata.tables[i].table_name + '</span></td>\
                        <td>' + rdata.tables[i].type + '</td>\
                        <td><span style="width:90px;"> ' + rdata.tables[i].collation + '</span></td>\
                        <td>' + rdata.tables[i].rows_count + '</td>\
                        <td>' + rdata.tables[i].data_size + '</td>\
                        <td style="text-align: right;">\
                            <a class="btlink" onclick="database.rep_database(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\')">修复</a> |\
                            <a class="btlink" onclick="database.op_database(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\')">优化</a> |\
                            <a class="btlink" onclick="database.to_database_type(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\',\'' + types[rdata.tables[i].type] + '\')">转为' + types[rdata.tables[i].type] + '</a>\
                        </td>\
                    </tr> '
            }

            if (res) {
                $(".gztr").html(tbody);
                $("#db_tools").html('');
                $("input[type='checkbox']").attr("checked", false);
                $(".tools_size").html('大小：' + rdata.data_size);
                return;
            }

            layer.open({
                type: 1,
                title: "MySQL工具箱【" + db_name + "】",
                area: ['780px', '580px'],
                closeBtn: 2,
                shadeClose: false,
                content: '<div class="pd15">\
                                <div class="db_list">\
                                    <span><a>数据库名称：'+ db_name + '</a>\
                                    <a class="tools_size">大小：'+ rdata.data_size + '</a></span>\
                                    <span id="db_tools" style="float: right;"></span>\
                                </div >\
                                <div class="divtable">\
                                <div  id="database_fix"  style="height:360px;overflow:auto;border:#ddd 1px solid">\
                                <table class="table table-hover "style="border:none">\
                                    <thead>\
                                        <tr>\
                                            <th><input class="check" onclick="database.selected_tools(this,\''+ db_name + '\');" type="checkbox"></th>\
                                            <th>表名</th>\
                                            <th>引擎</th>\
                                            <th>字符集</th>\
                                            <th>行数</th>\
                                            <th>大小</th>\
                                            <th style="text-align: right;">操作</th>\
                                        </tr>\
                                    </thead>\
                                    <tbody class="gztr">' + tbody + '</tbody>\
                                </table>\
                                </div>\
                            </div>\
                            <ul class="help-info-text c7">\
                                <li>【修复】尝试使用REPAIR命令修复损坏的表，仅能做简单修复，若修复不成功请考虑使用myisamchk工具</li>\
                                <li>【优化】执行OPTIMIZE命令，可回收未释放的磁盘空间，建议每月执行一次</li>\
                                <li>【转为InnoDB/MyISAM】转换数据表引擎，建议将所有表转为InnoDB</li>\
                            </ul></div>'
            });
            tableFixed('database_fix');
            //表格头固定
            function tableFixed(name) {
                var tableName = document.querySelector('#' + name);
                tableName.addEventListener('scroll', scrollHandle);
            }
            function scrollHandle(e) {
                var scrollTop = this.scrollTop;
                //this.querySelector('thead').style.transform = 'translateY(' + scrollTop + 'px)';
                $(this).find("thead").css({ "transform": "translateY(" + scrollTop + "px)", "position": "relative", "z-index": "1" });
            }
        });
    },
    selected_tools: function (my_obj, db_name) {
        var is_checked = false
        if (my_obj) is_checked = my_obj.checked;
        var db_tools = $("input[value^='dbtools_']");
        var n = 0;
        for (var i = 0; i < db_tools.length; i++) {
            if (my_obj) db_tools[i].checked = is_checked;
            if (db_tools[i].checked) n++;
        }
        if (n > 0) {
            var my_btns = '<button class="btn btn-default btn-sm" onclick="database.rep_database(\'' + db_name + '\',null)">修复</button><button class="btn btn-default btn-sm" onclick="database.op_database(\'' + db_name + '\',null)">优化</button><button class="btn btn-default btn-sm" onclick="database.to_database_type(\'' + db_name + '\',null,\'InnoDB\')">转为InnoDB</button></button><button class="btn btn-default btn-sm" onclick="database.to_database_type(\'' + db_name + '\',null,\'MyISAM\')">转为MyISAM</button>'
            $("#db_tools").html(my_btns);
        } else {
            $("#db_tools").html('');
        }
    },
    rep_database: function (db_name, tables) {
        dbs = database.rep_checkeds(tables)
        var loadT = layer.msg('已送修复指令,请稍候...', { icon: 16, time: 0 });
        bt.send('ReTable', 'database/ReTable', { db_name: db_name, tables: JSON.stringify(dbs) }, function (rdata) {
            layer.close(loadT)

            database.rep_tools(db_name, true);
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        });
    },
    op_database: function (db_name, tables) {
        dbs = database.rep_checkeds(tables)
        var loadT = layer.msg('已送优化指令,请稍候...', { icon: 16, time: 0 });
        bt.send('OpTable', 'database/OpTable', { db_name: db_name, tables: JSON.stringify(dbs) }, function (rdata) {
            layer.close(loadT)

            database.rep_tools(db_name, true);
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        });
    },
    to_database_type: function (db_name, tables, type) {
        dbs = database.rep_checkeds(tables)
        var loadT = layer.msg('已送引擎转换指令,请稍候...', { icon: 16, time: 0, shade: [0.3, "#000"] });
        bt.send('AlTable', 'database/AlTable', { db_name: db_name, tables: JSON.stringify(dbs), table_type: type }, function (rdata) {
            layer.close(loadT);

            database.rep_tools(db_name, true);
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        });
    },
    rep_checkeds: function (tables) {
        var dbs = []
        if (tables) {
            dbs.push(tables)
        } else {
            var db_tools = $("input[value^='dbtools_']");
            for (var i = 0; i < db_tools.length; i++) {
                if (db_tools[i].checked) dbs.push(db_tools[i].value.replace('dbtools_', ''));
            }
        }

        if (dbs.length < 1) {
            layer.msg('请至少选择一张表!', { icon: 2 });
            return false;
        }
        return dbs;
    },
    // 改密
    set_data_pass: function (id, username, password) {
        var bs = bt.database.set_data_pass(function (rdata) {
            if (rdata.status) database_table.$refresh_table_list(true);
            bt.msg(rdata);
        })
        $('.name' + bs).val(username);
        $('.id' + bs).val(id);
        $('.password' + bs).val(password);
    },
    // 删除
    del_database: function (wid, dbname, callback) {
        var rendom = bt.get_random_code(),num1 = rendom['num1'],num2 = rendom['num2'],title = '';
        title = typeof dbname === "function" ?'批量删除数据库':'删除数据库 [ '+ dbname +' ]';
        layer.open({
            type:1,
            title:title,
            icon:0,
            skin:'delete_site_layer',
            area: "530px",
            closeBtn: 2,
            shadeClose: true,
            content:"<div class=\'bt-form webDelete pd30\' id=\'site_delete_form\'>" +
                "<i class=\'layui-layer-ico layui-layer-ico0\'></i>" +
                "<div class=\'f13 check_title\' style=\'margin-bottom: 20px;\'>是否确认【删除数据库】，删除后可能会影响业务使用！</div>" +
                "<div style=\'color:red;margin:18px 0 18px 18px;font-size:14px;font-weight: bold;\'>注意：数据无价，请谨慎操作！！！"+(!recycle_bin_db_open?'<br>风险操作：当前数据库回收站未开启，删除数据库将永久消失！':'')+"</div>" +
                "<div class=\'vcode\'>" + lan.bt.cal_msg + "<span class=\'text\'>"+ num1 +" + "+ num2 +"</span>=<input type=\'number\' id=\'vcodeResult\' value=\'\'></div>" +
                "</div>",
            btn:[lan.public.ok,lan.public.cancel],
            yes:function(indexs){
                var vcodeResult = $('#vcodeResult'),data = {id: wid,name: dbname};
                if(vcodeResult.val() === ''){
                    layer.tips('计算结果不能为空', vcodeResult, {tips: [1, 'red'],time:3000})
                    vcodeResult.focus()
                    return false;
                }else if(parseInt(vcodeResult.val()) !== (num1 + num2)){
                    layer.tips('计算结果不正确', vcodeResult, {tips: [1, 'red'],time:3000})
                    vcodeResult.focus()
                    return false;
                }
                if(typeof dbname === "function"){
                    delete data.id;
                    delete data.name;
                }
                layer.close(indexs)
                var arrs = wid instanceof Array ? wid : [wid]
                var ids = JSON.stringify(arrs), countDown = 9;
                if (arrs.length == 1) countDown = 4
                title = typeof dbname === "function" ?'二次验证信息，批量删除数据库':'二次验证信息，删除数据库 [ ' + dbname + ' ]';
                var loadT = bt.load('正在检测数据库数据信息，请稍后...')
                bt.send('check_del_data', 'database/check_del_data', {ids: ids}, function (res) {
                    loadT.close()
                    layer.open({
                        type:1,
                        title:title,
                        closeBtn: 2,
                        skin: 'verify_site_layer_info active',
                        area: '740px',
                        content: '<div class="check_delete_site_main pd30">' +
                            '<i class="layui-layer-ico layui-layer-ico0"></i>' +
                            '<div class="check_layer_title">堡塔温馨提示您，请冷静几秒钟，确认是否要以下删除数据。</div>' +
                            '<div class="check_layer_content">' +
                            '<div class="check_layer_item">' +
                            '<div class="check_layer_site"></div>' +
                            '<div class="check_layer_database"></div>' +
                            '</div>' +
                            '</div>' +
                            '<div class="check_layer_error ' + (recycle_bin_db_open ? 'hide' : '') + '"><span class="glyphicon glyphicon-info-sign"></span>风险事项：当前未开启数据库回收站功能，删除数据库后，数据库将永久消失！</div>' +
                            '<div class="check_layer_message">请仔细阅读以上要删除信息，防止数据库被误删，确认删除还有 <span style="color:red;font-weight: bold;">' + countDown + '</span> 秒可以操作。</div>' +
                            '</div>',
                        btn: ['确认删除(' + countDown + '秒后继续操作)', '取消删除'],
                        success: function (layers) {
                            var html = '', rdata = res.data;
                            var filterData = rdata.filter(function(el){
                                return  ids.indexOf(el.id) != -1
                            })
                            for (var i = 0; i < filterData.length; i++) {
                                var item = filterData[i], newTime = parseInt(new Date().getTime() / 1000),
                                    t_icon = '<span class="glyphicon glyphicon-info-sign" style="color: red;width:15px;height: 15px;;vertical-align: middle;"></span>';

                                database_html = (function(item){
                                    var is_time_rule = (newTime - item.st_time) > (86400 * 30)  && (item.total > 1024 * 10),
                                        is_database_rule = res.db_size <= item.total,
                                        database_time = bt.format_data(item.st_time, 'yyyy-MM-dd'),
                                        database_size = bt.format_size(item.total);

                                    var f_size = '<i ' + (is_database_rule ? 'class="warning"' : '') + ' style = "vertical-align: middle;" > ' + database_size + '</i> ' + (is_database_rule ? t_icon : '');
                                    var t_size = '注意：此数据库较大，可能为重要数据，请谨慎操作.\n数据库：' + database_size;

                                    return '<div class="check_layer_database">' +
                                        '<span title="数据库：' + item.name + '">数据库：' + item.name + '</span>' +
                                        '<span title="' + t_size+'">大小：' + f_size +'</span>' +
                                        '<span title="' + (is_time_rule && item.total != 0 ? '重要：此数据库创建时间较早，可能为重要数据，请谨慎操作.' : '') + '时间：' + database_time+'">创建时间：<i ' + (is_time_rule && item.total != 0 ? 'class="warning"' : '') + '>' + database_time + '</i></span>' +
                                        '</div>'
                                }(item))
                                if(database_html !== '') html += '<div class="check_layer_item">' + database_html +'</div>';
                            }
                            if(html === '') html = '<div style="text-align: center;width: 100%;height: 100%;line-height: 300px;font-size: 15px;">无数据</div>'
                            $('.check_layer_content').html(html)
                            var interVal = setInterval(function () {
                                countDown--;
                                $(layers).find('.layui-layer-btn0').text('确认删除(' + countDown + '秒后继续操作)')
                                $(layers).find('.check_layer_message span').text(countDown)
                            }, 1000);
                            setTimeout(function () {
                                $(layers).find('.layui-layer-btn0').text('确认删除');
                                $(layers).find('.check_layer_message').html('<span style="color:red">注意：请仔细阅读以上要删除信息，防止数据库被误删</span>')
                                $(layers).removeClass('active');
                                clearInterval(interVal)
                            }, countDown * 1000)
                        },
                        yes:function(indes,layers){
                            if($(layers).hasClass('active')){
                                layer.tips('请确认信息，稍后在尝试，还剩'+ countDown +'秒', $(layers).find('.layui-layer-btn0') , {tips: [1, 'red'],time:3000})
                                return;
                            }
                            if(typeof dbname === "function"){
                                dbname(data)
                            }else{
                                bt.database.del_database(data, function (rdata) {
                                    layer.closeAll()
                                    if (rdata.status) database_table.$refresh_table_list(true);
                                    if (callback) callback(rdata);
                                    bt.msg(rdata);
                                })
                            }
                        }
                    })
                })
            }
        })
    },
}

database.database_table_view();