//TODO:指令数据与栈空间不重叠
//枚举icode,register,ifun,值得注意的是cmovl与rrmovl都是2
var icode={nop:"0",halt:"1",rrmovl:"2",irmovl:"3",rmmovl:"4",mrmovl:"5",opl:"6",jxx:"7",cmovxx:"2",call:"8",ret:"9",pushl:"a",popl:"b"};
var ficode=["0","1","2","3","4","5","6","7","8","9","a","b"];
var oplfunc={addl:"0",subl:"1",andl:"2",xorl:"3"};
var jfunc={jmp:"0",jle:"1",jl:"2",je:"3",jne:"4",jge:"5",jg:"6"};
var cfunc={rrmovl:"0",cmovle:"1",cmovl:"2",cmove:"3",cmovne:"4",cmovge:"5",cmovg:"6"};
var R={eax:"0",ecx:"1",edx:"2",ebx:"3",esp:"4",ebp:"5",esi:"6",edi:"7",none:"8"};
var stat={SAOK:1,SADR:2,SINS:3,SHLT:4};
var FONE=0;
var r=[];
var stack={};
var M={};

//当前周期数目
var curcycle;
//Register类
var Register= {
    createNew: function () {
        var register=[];
        return register;
    }
};
//CycleStore类 用于存储某个周期内全部的值（回退的时候使用）
var CycleStore={
    createNew:function(){
        var cycle={};
        //周期数
        cycle.cyclenum=0x0;

        //CC
        cycle.ZF=0;
        cycle.OF=0;
        cycle.SF=0;

        //Pipeline Register F
        cycle.F_predPC=0x00000000;

        //Intermediate Values in Fetch Stage
        cycle.f_icode=0;
        cycle.f_ifun=null;
        cycle.f_valC=null;
        cycle.f_valP=null;
        //f_pc
        cycle.f_pc=null;
        cycle.is=null;

        //Pipeline Register D
        cycle.D_icode=0x0;
        cycle.D_ifun=0x0;
        cycle.D_rA=0x0;
        cycle.D_rB=0x0;
        cycle.D_valC=0x0000;
        cycle.D_valP=0x00000;

        //Intermediate Values in Decode Stage
        cycle.d_srcA=null;
        cycle.d_srcB=null;
        cycle.d_rvalA=null;
        cycle.d_rvalB=null;

        //Pipeline Register E
        cycle.E_icode=0x0;
        cycle.E_ifun=0x0;
        cycle.E_valC=0x0;
        cycle.E_srcA=0x0;
        cycle.E_valA=0x0000000;
        cycle.E_srcB=0x0;
        cycle.E_valB=0x0000000;
        cycle.E_dstE=0x0;
        cycle.E_dstM=0x0;

        //Intermediate Values in Execute Stage
        cycle.e_valE=0;
        cycle.e_Bch=null;

        //Pipeline Register M
        cycle.M_icode=0x0;
        //cycle.M_ifun=null;
        cycle.M_valA=0x0000000;
        cycle.M_dstE=0x0;
        cycle.M_valE=0x000000;
        cycle.M_dstM=0x0;
        cycle.M_Bch=false;

        //Intermediate Value in Memory Stage
        cycle.m_valM=0;

        //Pipeline Register W
        cycle.W_icode=0x0;
        cycle.W_dstE=0x0;
        cycle.W_valE=0x000000;
        cycle.W_dstM=0x0;
        cycle.W_valM=0x0000000;

        //Registers
        cycle.register=Register.createNew();

        //获取start开始处的四字节数据（注意是小端法）
        cycle.get_4bytes=function(start){
            substr=cycle.is.substr(start+6,2)+cycle.is.substr(start+4,2)+cycle.is.substr(start+2,2)+cycle.is.substr(start,2);
            return parseInt(substr,16);
        };
        cycle.get_valP=function(){
            //if(cycle.cyclenum==-1){
            //    console.log("Current pc",cycle.f_pc);
            //    console.log("Current f_icode",cycle.f_icode);
            //    console.log("need_regids",cycle.need_regids);
            //    console.log("need valC",cycle.need_valC);
            //}
            return cycle.f_pc+(cycle.is.length/2);
            //if(cycle.need_regids){
            //    console.log("have judge need_regids");
            //    ans=ans+1;
            //}
            //if(cycle.need_valC){
            //    console.log("have judge need_regids");
            //    ans=ans+4;
            //}
            //return ans;
        }
        return cycle;
    }
};
var cyclecounter;
//调试用
function helloworld(){
    console.log("y86.js loaded");
    ShowR();
}
//在console输出全部寄存器的值
function ShowR(){
    console.log("-------Register--------");
    for(var x in R)
        console.log(x+":"+r[R[x]]);
    //console.log("what happened")
    console.log("-------Register--------");
}

//寄存器初始化
function init(){
    for(var x in R){
        r[R[x]]=0;
        console.log("init register ", R[x]);
    }
    Current=CycleStore.createNew();
    New=CycleStore.createNew();
    //r[R.esp]=244;
    //r[R.ebp]=244;
    console.log("init success");
}

//判断某个元素在不在数组中
function inArray(a,b){
    return ($.inArray(a,b)!=-1);
}
//小端转大端
function lend(str){
    console.log("type of str",typeof(str));
    console.log()
    substr=str.substr(6,2)+str.substr(4,2)+str.substr(4,2)+str.substr(2,2)+str.substr(0,2);
    return substr;
}

//字符串转小端字符串
function tlend(str){
    var len=str.length;
    for(;len<8;len++){
        str="0"+str;
    }
    var ans=str.substr(6,2)+str.substr(4,2)+str.substr(2,2)+str.substr(0,2);
    return ans;
}
var Current;
var New;
var Temp;
function run(){
    //for(var x=1;x<=61;x++){
    //    if(!onecycle())
    //        break;
    //}
    if(Hasload==false){
        alert("跑也要按照基本法呀，中国有句古话，叫有代码才能跑！");
        $('input[id=input_file]').click();
        return false;
    }
    do{
        update(Current);
    }while(onecycle());
    //update(Current);
}
var Hz;
var Pause=false;
function moha(){
    //for(var x=1;x<=61;x++){
    //    if(!onecycle())
    //        break;
    //}
    Pause=false;
    if(Hasload==false){
        alert("跑也要按照基本法呀，中国有句古话，叫有代码才能跑！");
        $('input[id=input_file]').click();
        return false;
    }
    Hz=parseInt($("#hz").val());
    if(Hz==0) {
        do {
            update(Current);
            //setTimeout("timedCount()", 1000);
        } while (onecycle());
    }
    //update(Current);
    else {
        onehz();
    }
}

//pause
function pause(){
    Pause=true;
}
//run in 1HZ
function onehz(){
    if(Pause==false) {
        update(Current);
        if (Current.W_icode != icode.halt) {
            onecycle();
            setTimeout("onehz()", 1000 / Hz);
        }
    }
}

//step
function step(){
    Pause=false;
    if(onecycle()) {
        update(Current);
    }
}

//reset
function reset(){
    init();
    Current=CycleStore.createNew();
    update(Current);
    savestr=""
}

//save
var savestr="";
function save() {
        // works in firefox, and chrome 11
        var text ="hello world\n \tI can fan";
        var data = "data:x-application/text,"+encodeURIComponent(savestr);
        window.open(data);
}
//执行单个周期
function onecycle(){
    if(Current.W_icode==icode.halt){
        return false;
    }
    New=CycleStore.createNew();
    New.cyclenum=Current.cyclenum+1;
  //Fetch Stage
    //What address should instruction be fetched at
    if(Current.M_icode==icode.jxx&&!Current.M_Bch){
        Current.f_pc=Current.M_valA;
    }
    else if(Current.W_icode==icode.ret) {
        Current.f_pc = Current.W_valM;
    }
    else{
        Current.f_pc=Current.F_predPC;
    }
    if(!inArray(icode.ret, [Current.D_icode,Current.E_icode,Current.M_icode])) {
        Current.is = IS[Current.f_pc];
    }
    New.is=Current.is;
    //if(Current.cyclenum==5) {
    //    console.log("Current f_pc:",Current.f_pc);
    //    console.log("Current is:",Current.is);
    //}
    //if()
    //if(inArray(icode.ret, [Current.D_icode,Current.E_icode,Current.M_icode]))
    //{
    //    Current.f_icode=icode.nop;
    //    Current.f_ifun=Current.D_ifun;
    //}
    //else{
    //    Current.f_icode=Current.is[0];
    //    Current.f_ifun=Current.is[1];
    //}
    Current.f_icode=Current.is[0];
    New.D_icode=Current.f_icode;
    Current.f_ifun=Current.is[1];
    New.D_ifun=Current.f_ifun;
    //Does fetched instruction require a regid byte?
    Current.need_regids=inArray(Current.f_icode,[icode.rrmovl,icode.opl,icode.pushl,icode.popl,icode.irmovl,icode.rmmovl,icode.mrmovl]);

    //Does fetched instruction require a constant word?
    Current.need_valC=inArray(Current.f_icode, [icode.irmovl,icode.rmmovl,icode.mrmovl,icode.jxx,icode.call]);

    if(Current.need_regids){
        New.D_rA=Current.is[2];
        New.D_rB=Current.is[3];
    }
    else{
        New.D_rA= R.none;
        New.D_rB= R.none;
    }
    if(Current.need_valC){
        if(inArray(Current.f_icode,[icode.jxx,icode.call])){
            New.D_valC=Current.get_4bytes(2);
        }
        else{
            New.D_valC=Current.get_4bytes(4);
        }
    }
    New.D_valP=Current.get_valP();
    //Is instruction valid?
    Current.instr_valid=inArray(Current.f_icode,ficode);
    //
    ////Determine status code for fetched instruction
    //if(Current.imem_error){
    //    Current.f_stat=stat.SADR;
    //}
    //else if(!Current.instr_valid){
    //    Current.f_stat=stat.SINS;
    //}
    //else if(Current.f_icode==icode.halt){
    //    Current.f_stat=stat.SHLT;
    //}
    //else {
    //    Current.f_stat=stat.SAOK;
    //}
    //Predict next value of PC
    if(inArray(Current.f_icode,[icode.jxx,icode.call])){
        New.F_predPC=Current.get_4bytes(2);//f_valC
    }
    else{
        New.F_predPC=Current.get_valP();
    }

    //Decode Stage
    //Current.d_srcA=Current.D_rA;
    //Current.d_srcB=Current.D_rB;
    New.E_icode=Current.D_icode;
    New.E_ifun=Current.D_ifun;
    New.E_valC=Current.D_valC;
    //What register should be used as the A source?
    if(inArray(Current.D_icode,[icode.rrmovl,icode.rmmovl,icode.opl,icode.pushl])){
        Current.d_srcA=Current.D_rA;
    }
    else if(inArray(Current.D_icode, [icode.popl,icode.ret])){
        Current.d_srcA= R.esp;
    }
    else{
        Current.d_srcA= R.none;
    }
    //New.E_valA=r[Current.e_srcA];
    //What register should be used as the B source?
    if(inArray(Current.D_icode, [icode.opl,icode.rmmovl,icode.mrmovl])){
        Current.d_srcB=Current.D_rB;
    }
    else if(inArray(Current.D_icode, [icode.pushl,icode.popl,icode.call,icode.ret])){
        Current.d_srcB= R.esp;
    }
    else{
        Current.d_srcB= R.none;
    }
    //New.E_valB=r[Current.e_srcB];
    //console.log("srcB:",Current.e_srcB);
    //console.log("New.E_valB:",New.E_valB);
    //what register should be used at the E destination?
    //console.log("Current.D_icode:",Current.D_icode);
    if(inArray(Current.D_icode ,[icode.rrmovl,icode.irmovl,icode.opl])){
        New.E_dstE=Current.D_rB;
    }
    else if(inArray(Current.D_icode,[icode.pushl,icode.popl,icode.call,icode.ret])){
        New.E_dstE= R.esp;
    }
    else{
        New.E_dstE= R.none;
    }

    //What register should be used as the M destination?
    if(inArray(Current.D_icode, [icode.mrmovl,icode.popl])){
        New.E_dstM=Current.D_rA;
    }
    else{
        New.E_dstM= R.none;
    }
    //R[A] R[B] d_srcA d_srcB
    New.E_srcB=Current.d_srcB;
    New.E_srcA=Current.d_srcA;
    New.E_valA=r[New.E_srcA];
    New.E_valB=r[New.E_srcB];
    if(Current.cyclenum==5){
        console.log("E_valA:%d E_valB:%d",New.E_valA,New.E_valB);
    }
    //console.log()

    //Execute Stage
    //Select input A to ALU
    New.M_icode=Current.E_icode;
    New.M_dstM=Current.E_dstM;
    New.M_dstE=Current.E_dstE;
    var aluA;
    if($.inArray(Current.E_icode,[icode.rrmovl,icode.opl])!=-1){
        aluA=Current.E_valA;
    }
    else if($.inArray(Current.E_icode,[icode.irmovl,icode.rmmovl,icode.mrmovl])!=-1){
        aluA=Current.E_valC;
    }
    else if($.inArray(Current.E_icode,[icode.call,icode.pushl])!=-1){
        aluA=-4;
    }
    else if($.inArray(Current.E_icode, [icode.ret,icode.popl])!=-1){
        aluA=4;
    }

    //Select input B to ALU
    var aluB;
    if($.inArray(Current.E_icode,[icode.rmmovl,icode.mrmovl,icode.opl,icode.call,icode.pushl,icode.ret,icode.popl])!=-1){
        aluB=Current.E_valB;
    }
    else if($.inArray(Current.E_icode,[icode.rrmovl,icode.irmovl])!=-1){
        aluB=0;
    }

    //Set the ALU function
    var alufun;
    if(Current.E_icode==icode.opl){
        alufun=Current.E_ifun;
    }
    else {
        alufun=oplfunc.addl;
    }
    New.M_valE=Current.E_valB;
    New.M_valA=Current.E_valA;
    //alu execute
    if(aluA!=undefined) {
        if (alufun == oplfunc.addl) {
            New.M_valE = (aluB + aluA)&(0xffffffff);
        }
        else if (alufun == oplfunc.subl) {
            New.M_valE = (aluB - aluA)&(0xffffffff);
        }
        else if (alufun == oplfunc.andl) {
            New.M_valE = aluB & aluA;
        }
        else if (alufun == oplfunc.xorl) {
            New.M_valE = aluB ^ aluA;
        }
    }
    //console.log("alufun=",alufun);
    Current.e_valE=New.M_valE;
    //Should the condition codes be updated ?
    var set_cc=(Current.E_icode==icode.opl);
    if(set_cc){
        Current.ZF=(New.M_valE==0);
        Current.SF=(New.M_valE<0);
        var siga=(aluA>0);
        var sigb=(aluB>0);
        var sige=New.M_valE>0;
        Current.OF=Current.E_ifun==oplfunc.addl&&
            (siga&&sigb&&!sige||!siga&&!sigb&&sige)||
            Current.E_ifun==oplfunc.subl&&
            (sigb&&!siga&&!sige||!sigb&&siga&&sige);
    }
    //Set New.cc
    New.ZF=Current.ZF;
    New.SF=Current.SF;
    New.OF=Current.OF;
    //Set M_Bch
    if(Current.E_icode==icode.jxx){
        if(Current.E_ifun==jfunc.jle){
            Current.e_Bch=(Current.SF^Current.OF)|Current.ZF;
        }
        else if(Current.E_ifun==jfunc.je){
            Current.e_Bch=Current.ZF;
        }
        else if(Current.E_ifun==jfunc.jl){
            Current.e_Bch=Current.SF^Current.OF;
        }
        else if(Current.E_ifun==jfunc.jmp){
            Current.e_Bch=true;
        }
        else if(Current.E_ifun==jfunc.jne){
            Current.e_Bch=!Current.ZF;
        }
        else if(Current.E_ifun==jfunc.jge){
            Current.e_Bch=!(Current.SF^Current.OF);
        }
        else if(Current.E_ifun==jfunc.jg){
            Current.e_Bch=(!(Current.SF^Current.OF))&&(!Current.ZF);
        }
        New.M_Bch=Current.e_Bch;
    }
    else{
        Current.e_Bch=false;
        New.M_Bch=false;
    }

    //Memory Stage
    //Select memory address
    New.W_dstE=Current.M_dstE;
    New.W_dstM=Current.M_dstM;
    New.W_icode=Current.M_icode;
    New.W_valE=Current.M_valE;
    var mem_addr;
    if($.inArray(Current.M_icode, [icode.rmmovl,icode.pushl,icode.call,icode.mrmovl])!=-1){
        mem_addr=Current.M_valE;
    }
    else if($.inArray(Current.M_icode,[icode.popl,icode.ret])!=-1){
        mem_addr=Current.M_valA;
    }

    //Set read control signal
    var mem_read=($.inArray(Current.M_icode,[icode.mrmovl,icode.popl,icode.ret])!=-1);

    //Set write control signal
    var mem_write=($.inArray(Current.M_icode,[icode.rmmovl,icode.pushl,icode.call])!=-1);

    //进行读写
    if(mem_read){
        console.log("read 0x%s value=%s",mem_addr.toString(16),IS[mem_addr]);
        Current.m_valM=parseInt(lend(IS[mem_addr]),16);
        New.W_valM=Current.m_valM;
    }
    if(mem_write){
        console.info("write 0x%s value=%s",mem_addr.toString(16),tlend(Current.M_valA.toString(16)));
        console.log("type of mem_addr",typeof(mem_addr) );
        //if(Current.cyclenum==7){
        //    console.log("asd")
        //}
        //存到memory中时应先变成小端法
        IS[mem_addr]=tlend(Current.M_valA.toString(16));
    }

    //What should be the A value?
    //Forward into decode stage for valA
    if($.inArray(Current.D_icode,[icode.call,icode.jxx])!=-1){
        New.E_valA=Current.D_valP;
    }
    else if(Current.d_srcA!= R.none) {
        if (Current.d_srcA == Current.E_dstE) {
            New.E_valA = Current.e_valE;
        }
        else if (Current.d_srcA == Current.M_dstM) {
            New.E_valA = Current.m_valM;
        }
        else if (Current.d_srcA == Current.M_dstE) {
            New.E_valA = Current.M_valE;
        }
        else if (Current.d_srcA == Current.W_dstM) {
            New.E_valA = Current.W_valM;
        }
        else if (Current.d_srcA == Current.W_dstE) {
            New.E_valA = Current.W_valE;
        }
    }

    if(Current.d_srcB!= R.none){
        if(Current.d_srcB==Current.E_dstE){
            New.E_valB=Current.e_valE;
        }
        else if(Current.d_srcB==Current.M_dstM){
            New.E_valB=Current.m_valM;
        }
        else if(Current.d_srcB==Current.M_dstE){
            New.E_valB=Current.M_valE;
        }
        else if(Current.d_srcB==Current.W_dstM){
            New.E_valB=Current.W_valM;
        }
        else if(Current.d_srcB==Current.W_dstE){
            New.E_valB=Current.W_valE;
        }
    }
    if(Current.cyclenum==5){
        console.log("E_valA:%d E_valB:%d",New.E_valA,New.E_valB);
    }

    //Write Back
    r[Current.W_dstE]=Current.W_valE;
    r[Current.W_dstM]=Current.W_valM;

    //Pipeline Register Control
    //Should I stall or inject a bubble into Pipeline Register F?
    //At most one of these can be true.
    var F_bubble=0
    var F_stall=inArray(Current.E_icode, [icode.mrmovl,icode.popl] )&&
            inArray(Current.E_dstM,[Current.d_srcA,Current.d_srcB] )||
            inArray(icode.ret, [Current.D_icode,Current.E_icode,Current.M_icode]);
    if(F_stall){
        New.F_predPC=Current.F_predPC;
    }

    //Should I stall or inject a bubble into pipeleine Register D?
    //At most one of these can be true
    var D_stall=
        inArray(Current.E_icode , [icode.mrmovl,icode.popl]) &&
           inArray( Current.E_dstM , [Current.d_srcA,Current.d_srcB]);

    var D_bubble=
        (Current.E_icode==icode.jxx&&!Current.e_Bch)||
            inArray(icode.ret, [Current.D_icode,Current.E_icode,Current.M_icode]);
    if(D_stall){
        New.D_icode=Current.D_icode;
        New.D_ifun=Current.D_ifun;
        New.D_rA=Current.D_rA;
        New.D_rB=Current.D_rB;
        New.D_valC=Current.D_valC;
        New.D_valP=Current.D_valP;
    }
    else if(D_bubble){
        New.D_icode=icode.nop;
    }

    //Should I stall or inject a bubble into Pipeline Register E?
    //At most one of these can be true.
    var E_stall=0;
    var E_bubble=
        (Current.E_icode==icode.jxx&&!Current.e_Bch)||
           inArray(Current.E_icode,[icode.mrmovl,icode.popl])&&
              inArray(Current.E_dstM,[Current.d_srcA,Current.d_srcB]);
    if(E_bubble){
        New.E_icode=icode.nop;
        New.E_dstE= R.none;
        New.E_dstM= R.none;
        New.E_srcA= R.none;
        New.E_srcB= R.none;
    }
    //Should I stall or inject a bubble into Pipeleine Register M
    //At most one of these can be true.
    var M_stall=0;
    var M_bubble=0;
    //showcycle(Current);
    Current=New;
    return true;
    //showcycle(New);
}
function show32bit(num){
    str=(num>>>0).toString(16);
    var len=str.length;
    for(;len<8;len++){
        str="0"+str;
    }
    return "0x"+str;
}
function hex(num){
    return "0x"+num.toString(16);
}
//String format
String.format = function(src){
    if (arguments.length == 0) return null;
    var args = Array.prototype.slice.call(arguments, 1);
    return src.replace(/\{(\d+)\}/g, function(m, i){
        return args[i];
    });
};
var template="Cycle_{0}\n" +
    "--------------------\n" +
    "FETCH:\n" +
    "\tF_predPC\t= {1}\n" +
    "DECODE:\n" +
    "\tD_icode\t\t= {2}\n" +
    "\tD_ifun\t\t= {3}\n" +
    "\tD_rA\t\t= {4}\n" +
    "\tD_rB\t\t= {5}\n" +
    "\tD_valC\t\t= {6}\n" +
    "\tD_valP\t\t= {7}\n" +
    "EXCUTE:\n" +
    "\tE_icode\t\t= {8}\n" +
    "\tE_ifun\t\t= {9}\n" +
    "\tE_valC\t\t= {10}\n" +
    "\tE_valA\t\t= {11}\n" +
    "\tE_valB\t\t= {12}\n" +
    "\tE_dstE\t\t= {13}\n" +
    "\tE_dstM\t\t= {14}\n" +
    "\tE_srcA\t\t= {15}\n" +
    "\tE_srcB\t\t= {16}\n" +
    "MEMORY:\n" +
    "\tM_icode\t\t= {17}\n" +
    "\tM_Bch\t\t= {18}\n" +
    "\tM_valE\t\t= {19}\n" +
    "\tM_valA\t\t= {20}\n" +
    "\tM_dstE\t\t= {21}\n" +
    "\tM_dstM\t\t= {22}\n" +
    "WRITE BACK:\n" +
    "\tW_icode\t\t= {23}\n" +
    "\tW_valE\t\t= {24}\n" +
    "\tW_valM\t\t= {25}\n" +
    "\tW_DstE\t\t= {26}\n" +
    "\tW_dstM\t\t= {27}\n\n";
function update(One){
    //set savestr ,it's a bad implement
    savestr=savestr+String.format(template,One.cyclenum,show32bit(One.F_predPC),
        hex(One.D_icode),hex(One.D_ifun),hex(One.D_rA),hex(One.D_rB),show32bit(One.D_valC),show32bit(One.D_valP),
        hex(One.E_icode),hex(One.E_ifun),show32bit(One.E_valC),show32bit(One.E_valA),show32bit(One.E_valB),hex(One.E_dstE),hex(One.E_dstM),hex(One.E_srcA),hex(One.E_srcB),
        hex(One.M_icode),One.M_Bch.toString(),show32bit(One.M_valE),show32bit(One.M_valA),hex(One.M_dstE),hex(One.M_dstM),
        hex(One.W_icode),show32bit(One.W_valE),show32bit(One.W_valM),hex(One.W_dstE),hex(One.W_dstM));
    //end
    $("#F_predPC").html(show32bit(One.F_predPC));
    $("#D_icode").html(hex(One.D_icode));
    $("#D_ifun").html(hex(One.D_ifun));
    $("#D_rA").html(hex(One.D_rA));
    $("#D_rB").html(hex(One.D_rB));
    $("#D_valC").html(show32bit(One.D_valC));
    $("#D_valP").html(show32bit(One.D_valP));
    $("#E_icode").html(hex(One.E_icode));
    $("#E_ifun").html(hex(One.E_ifun));
    $("#E_valC").html(show32bit(One.E_valC));
    $("#E_valA").html(show32bit(One.E_valA));
    $("#E_valB").html(show32bit(One.E_valB));
    $("#E_dstE").html(hex(One.E_dstE));
    $("#E_dstM").html(hex(One.E_dstM));
    $("#E_srcA").html(hex(One.E_srcA));
    $("#E_srcB").html(hex(One.E_srcB));
    $("#M_icode").html(hex(One.M_icode));
    $("#M_Bch").html(One.M_Bch.toString());
    $("#M_valE").html(show32bit(One.M_valE));
    $("#M_valA").html(show32bit(One.M_valA));
    $("#M_dstE").html(hex(One.M_dstE));
    $("#M_dstM").html(hex(One.M_dstM));
    $("#W_icode").html(hex(One.W_icode));
    $("#W_valE").html(show32bit(One.W_valE));
    $("#W_valM").html(show32bit(One.W_valM));
    $("#W_dstE").html(hex(One.W_dstE));
    $("#W_dstM").html(hex(One.W_dstM));
    $("#cyclenum").html(One.cyclenum);
    $("#eax").html(show32bit(r[R.eax]));
    $("#ecx").html(show32bit(r[R.ecx]));
    $("#edx").html(show32bit(r[R.edx]));
    $("#ebx").html(show32bit(r[R.ebx]));
    $("#esp").html(show32bit(r[R.esp]));
    $("#ebp").html(show32bit(r[R.ecx]));
    $("#esi").html(show32bit(r[R.esi]));
    $("#edi").html(show32bit(r[R.edi]));
}
function onestep(){
    onecycle();
    update(Current);
}
function showcycle(One){
    //console.log("Current pc 0x:",One.f_pc.toString(16));
    console.log("Cycle_",One.cyclenum);
    console.log("-----------------");
    console.log("FETCH:");
    console.log("\tF_predPC\t= 0x",One.F_predPC.toString(16));
    console.log("DECODE:");
    console.log("\tD_icode\t= 0x",One.D_icode);
    console.log("\tD_ifun\t= 0x",One.D_ifun);
    console.log("\tD_rA\t= 0x",One.D_rA);
    console.log("\tD_rB\t= 0x",One.D_rB);
    console.log("\tD_valC\t= 0x",One.D_valC.toString(16));
    console.log("\tD_valP\t= 0x",One.D_valP.toString(16));
    console.log("\n");
    console.log("EXECUTE:");
    console.log("\tE_icode\t= 0x",One.E_icode);
    console.log("\tE_ifun\t= 0x",One.E_ifun);
    console.log("\tE_valC\t= 0x",One.E_valC.toString(16));
    console.log("\tE_valA\t= 0x",One.E_valA.toString(16));
    console.log("\tE_valB\t= 0x",One.E_valB.toString(16));
    console.log("\tE_dstE\t= 0x",One.E_dstE);
    console.log("\tE_dstM\t= 0x",One.E_dstM);
    console.log("\tE_srcA\t= 0x",One.E_srcA);
    console.log("\tE_srcB\t= 0x",One.E_srcB);
    console.log("MEMORY:");
    console.log("\tM_icode\t= 0x",One.M_icode);
    console.log("\tM_Bch\t= 0x",One.M_Bch);
    console.log("\tM_valE\t= 0x",One.M_valE.toString(16));
    console.log("\tM_valA\t= 0x",One.M_valA.toString(16));
    console.log("\tM_dstE\t= 0x",One.M_dstE);
    console.log("\tM_dstM\t= 0x",One.M_dstM);
    console.log("WRITE BACK:");
    console.log("\tW_icode\t= 0x",One.W_icode);
    console.log("\tW_valE\t= 0x",One.W_valE.toString(16));
    console.log("\tW_valM\t= 0x",One.W_valM);
    console.log("\tW_dstE\t= 0x",One.W_dstE);
    console.log("\tW_dstM\t= 0x",One.W_dstM);
    //ShowR();
    //console.log(One);
    console.log("\n");
}