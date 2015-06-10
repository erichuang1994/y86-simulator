/**
 * Created by eric on 6/7/15.
 * q465168867@gmail.com
 */
var R={"%eax":"0","%ecx":"1","%edx":"2","%ebx":"3","%esp":"4","%ebp":"5","%esi":"6","%edi":"7",none:"8"};
var stat={SAOK:1,SADR:2,SINS:3,SHLT:4};
var instr={
    "nop": "00",
    "halt": "10",
    "rrmovl": "20",
    "irmovl": "30",
    "rmmovl": "40",
    "mrmovl": "50",
    "addl": "60",
    "subl": "61",
    "andl": "62",
    "xorl": "63",
    "jmp": "70",
    "jle": "71",
    "jl": "72",
    "je": "73",
    "jne": "74",
    "jge": "75",
    "jg": "76",
    "call": "80",
    "ret": "90",
    "pushl": "a0",
    "popl": "b0",
}
var instbyte={
    "nop": 1,
    "halt": 1,
    "rrmovl": 2,
    "irmovl": 6,
    "rmmovl": 6,
    "mrmovl": 6,
    "addl": 2,
    "subl": 2,
    "andl": 2,
    "xorl": 2,
    "jmp": 5,
    "jle": 5,
    "jl": 5,
    "je": 5,
    "jne": 5,
    "jge": 5,
    "jg": 5,
    "call": 5,
    "ret": 1,
    "pushl": 2,
    "popl": 2,
}
var bytelen={
    ".long": 4,
    ".word": 2,
    ".byte": 1,
    ".align":0
}
var New;
//存储指令的数组
var list=[];
//储存label的字典，索引是labelname，值是地址
var label={};
//字符串转小端字符串
//change str to little end
function tlend(str){
    var len=str.length;
    for(;len<8;len++){
        str="0"+str;
    }
    var ans=str.substr(6,2)+str.substr(4,2)+str.substr(2,2)+str.substr(0,2);
    return ans;
}
//将number转成3位十六进制地址
//change number to 3bit hex address
function hexaddress(x){
    var temp= x.toString(16);
    var len=temp.length;
    for(;len<3;len++){
        temp="0"+temp;
    }
    return "0x"+temp;
}
var output="";
//这是汇编的核心部分
//思路是首先处理下字符串，去掉空格 空行注释等多余的部分
//然后先循环第一次计算出各条指令的地址
//再循环一次翻译指令，将label替换成对应的地址
function assembler(input){
    //去掉注释 多余的空格
    input=input.replace(/\/\*.*?\*\//g,'');
    input=input.replace(/#.*/g,'');
    input=input.replace(/ *, +/g,',');
    input=input.replace(/\n(\s)*/g,'\n');
    input=input.replace(/(\n)+/g,'\n');
    input=input.replace(/^\n/g,'');
    input=input.replace(/(\S) +(\S)/g,"$1 $2");
    //去掉回车符
    input=input.replace(/\r/g,'');
    New=input;
    backup=New.split('\n');
    var len=backup.length;
    for(var x=0;x<len;x++){
        if(backup[x]!="")
        list.push({"ori":backup[x]});
    }
    console.log(list);
    //计算地址
    //calculate address
    list[0].ins=list[0].ori.split(" ");
    //bias is nextaddress-address
    var bias=0;
    if(list[0].ins[0]==".pos"){
        list[0].address=parseInt(list[0].ins[1],16);
    }
    else{
        list[0].address=0;
        if(instbyte[list[0].ins[0]]!=undefined){
            bias=instbyte[list[0].ins[0]];
        }
    }
    list[0].nextaddress=list[0].address+bias;
    var listlen=list.length;
    for(var x=1;x<listlen;x++){
        console.log("x:",x);
        list[x].address=list[x-1].nextaddress;
        console.log("address:",list[x].address);
        list[x].ins=list[x].ori.split(":");
        if(list[x].ins.length==2){
            list[x].ins[1]=list[x].ins[1].replace(/^(\s)*/,'');
            label[list[x].ins[0]]=list[x].address;
            //如果形如 Loop:
            if(list[x].ins[1]==""){
                list[x].nextaddress=list[x].address;
                continue;
            }
            list[x].ins[0]=list[x].ins[1];
        }
        console.log(list[x]);
        list[x].ins=list[x].ins[0].split(" ");
        //去掉行首的空格
        list[x].ins[0]=list[x].ins[0].replace(/^(\s)+/,'');
        if(list[x].ins.length==2) {
            list[x].ins[1] = list[x].ins[1].replace(/^(\s)+/,'');
        }
        if(list[x].ins[0]==".pos"){
            list[x].address=parseInt(list[x].ins[1],16);
            list[x].nextaddress=list[x].address;
            continue;
        }else if(list[x].ins[0]==".align"){
            list[x].address=list[x].address+4-(list[x].address%4);
            list[x].nextaddress=list[x].address;
            continue;
        }
        bias=0;
        ////去掉指令中的怪符号
        //list[x].ins[0]=list[x].ins[0].replace(/\n/g,'');
        //判断指令是否合法
        if(instbyte[list[x].ins[0]]!=undefined){
            bias=instbyte[list[x].ins[0]];
        }else if(bytelen[list[x].ins[0]]!=undefined){
            bias=bytelen[list[x].ins[0]];
        }
        else{
            alert("指令",list[x].ins[0],"不存在!");
        }
        list[x].nextaddress=list[x].address+bias;
        //list[x].instr=temp.slice();
    }
    //替换label
    //replace labe
    //处理指令，将翻译出来的机器码先存在instr[x].bin里
    for(var x=0;x<listlen;x++){
        console.log(list[x]);
        switch(list[x].ins[0]){
            case "halt":
            case "nop":
            case "ret":
                list[x].bin=instr[list[x].ins[0]];
                break;
            case "jmp":
            case "jle":
            case "jl":
            case "je":
            case "jne":
            case "jge":
            case "jg":
            case "call":
                if(label[list[x].ins[1]]==undefined){
                    alert("label name "+list[x].ins[1]+"irlegal");
                }
                else{
                    list[x].bin=instr[list[x].ins[0]]+tlend(label[list[x].ins[1]].toString(16));
                }
                break;
            case "pushl":
            case "popl":
                list[x].bin=instr[list[x].ins[0]]+ R[list[x].ins[1]]+ R.none;
                break;
            case "addl":
            case "subl":
            case "andl":
            case "xorl":
            case "rrmovl":
                var reg=list[x].ins[1].split(",");
                list[x].bin=instr[list[x].ins[0]]+R[reg[0]]+R[reg[1]];
                break;
            case "irmovl":
                var reg=list[x].ins[1].split(",");
                if(reg[0][0]!="$"){
                    if(label[reg[0]]==undefined){
                        alert("irlegal label:",reg[0]);
                    }
                    else {
                        var V = tlend(label[reg[0]].toString(16));
                    }
                }
                else{
                    var num=parseInt(reg[0].substr(1))>>>0;
                    var V=tlend(num.toString(16));
                }
                list[x].bin=instr[list[x].ins[0]]+ R.none+R[reg[1]]+V;
                break;
            case "rmmovl":
            case "mrmovl":
                var arg=list[x].ins[1].split(",",2);
                if(list[x].ins[0]=="rmmovl"){
                    var rA=arg[0];
                    var temp=/(.*)\((.*)\)/.exec(arg[1]);
                    var rB=temp[2];
                    var D=temp[1];
                }
                else{
                    var rA=arg[1];
                    var temp=/(.*)\((.*)\)/.exec(arg[0]);
                    var rB=temp[2];
                    var D=temp[1];
                }
                if(D==""){
                  D=0;
                }
                D=parseInt(D);
                list[x].bin=instr[list[x].ins[0]]+R[rA]+R[rB]+tlend(D.toString(16));
                break;
            case ".long" :
                list[x].bin=tlend(parseInt(list[x].ins[1]).toString(16));
                break;
            default :
                list[x].bin="";
                break;
        }
        var out;
        //格式化输出
        switch(list[x].bin.length){
            case 12:
                out=" "+hexaddress(list[x].address)+": "+list[x].bin+" "+"|"+list[x].ori;
                break;
            case 4:
                out=" "+hexaddress(list[x].address)+": "+list[x].bin+"         "+"|"+list[x].ori;
                break;
            case 2:
                out=" "+hexaddress(list[x].address)+": "+list[x].bin+"           "+"|"+list[x].ori;
                break;
            case 8:
                out=" "+hexaddress(list[x].address)+": "+list[x].bin+"     "+"|"+list[x].ori;
                break;
            case 10:
                out=" "+hexaddress(list[x].address)+": "+list[x].bin+"   "+"|"+list[x].ori;
                break;
            default :
                out=" "+hexaddress(list[x].address)+": "+list[x].bin+"             "+"|"+list[x].ori;
                break;
        }
        //if(list[x].bin.length==12){
        //    out=" "+hexaddress(list[x].address)+": "+list[x].bin+" "+"|"+list[x].ori;
        //}
        //else if(list[x].bin.length==4){
        //    out=" "+hexaddress(list[x].address)+": "+list[x].bin+"         "+"|"+list[x].ori;
        //}else if(list[x].bin.length==2){
        //    out=" "+hexaddress(list[x].address)+": "+list[x].bin+"           "+"|"+list[x].ori;
        //}else if(list)
        //else{
        //    out=" "+hexaddress(list[x].address)+": "+list[x].bin+"             "+"|"+list[x].ori;
        //}
        console.log(x);
        console.log(out);
        output=output+"\n"+out;
        //console.log("address:",list[x].address);
    }
}
//执行汇编并显示
//不过为了更好地体验，在载入时实际的汇编就已经完成
//此函数不过是把载入时的汇编结果显示出来
function Complier(){
    $("#mcode").empty();
    $("#code").empty();
    $("#code").append(oriresult);
    $("#mcode").append(output);
    prettyPrint();
}
//保存
//此函数用来保存汇编文件到本地
//使用了FileSaver.js(感谢老豪神推荐）
function save() {
    // works in firefox, and chrome 11
    //var text ="hello world\n \tI can fan";
    var blob=new Blob([output], {type: "text/plain;charset=utf-8"});
    //var data = "data:x-application/text,"+encodeURIComponent(savestr);
    //window.open(data);
    saveAs(blob,"asum.yo");
}
//重置
function reset(){
    input=[];
    output="";
    var str="import y86\nprint\"Life is short,I use Python!\"";
    $("#mcode").empty();
    $("#code").empty();
    $("#code").append(str);
    $("#mcode").append(str);
    prettyPrint();
}
