(function (root) {
  "use strict";

  const schoolDirectory = {
    ustc: ["中国科学技术大学", "中国科大", "合肥", "安徽", "central"],
    hfut: ["合肥工业大学", "合肥工大", "合肥", "安徽", "central"],
    ahnu: ["安徽师范大学", "安徽师大", "芜湖", "安徽", "central"],
    ahu: ["安徽大学", "安徽大学", "合肥", "安徽", "central"],
    hsu: ["黄山学院", "黄山学院", "黄山", "安徽", "central"],
    ahmu: ["安徽医科大学", "安徽医大", "合肥", "安徽", "central"],
    ahpu: ["安徽工程大学", "安徽工程", "芜湖", "安徽", "central"],
    cuc: ["中国传媒大学", "中传", "北京", "北京", "north"],
    buaa: ["北京航空航天大学", "北航", "北京", "北京", "north"],
    cau: ["中国农业大学", "中国农大", "北京", "北京", "north"],
    xmu: ["厦门大学", "厦门大学", "厦门", "福建", "south"],
    hqu: ["华侨大学", "华侨大学", "泉州", "福建", "south"],
    scut: ["华南理工大学", "华南理工", "广州", "广东", "south"],
    sysu: ["中山大学", "中山大学", "广州", "广东", "south"],
    jnu: ["暨南大学", "暨南大学", "广州", "广东", "south"],
    hitsz: ["哈尔滨工业大学(深圳)", "哈工大深圳", "深圳", "广东", "south"],
    whu: ["武汉大学", "武汉大学", "武汉", "湖北", "central"],
    hust: ["华中科技大学", "华中科大", "武汉", "湖北", "central"],
    hzau: ["华中农业大学", "华中农大", "武汉", "湖北", "central"],
    wtu: ["武汉纺织大学", "武汉纺大", "武汉", "湖北", "central"],
    csu: ["中南大学", "中南大学", "长沙", "湖南", "central"],
    nenu: ["东北师范大学", "东北师大", "长春", "吉林", "north"],
    seu: ["东南大学", "东南大学", "南京", "江苏", "east"],
    nju: ["南京大学", "南京大学", "南京", "江苏", "east"],
    jiangnan: ["江南大学", "江南大学", "无锡", "江苏", "east"],
    dlut: ["大连理工大学", "大连理工", "大连", "辽宁", "north"],
    qhu: ["青海大学", "青海大学", "西宁", "青海", "west"],
    xjtu: ["西安交通大学", "西安交大", "西安", "陕西", "west"],
    xidian: ["西安电子科技大学", "西安电子", "西安", "陕西", "west"],
    hitwh: ["哈尔滨工业大学(威海)", "哈工大威海", "威海", "山东", "east"],
    sdu: ["山东大学", "山东大学", "济南", "山东", "east"],
    ouc: ["中国海洋大学", "中国海大", "青岛", "山东", "east"],
    shu: ["上海大学", "上海大学", "上海", "上海", "east"],
    sjtu: ["上海交通大学", "上海交大", "上海", "上海", "east"],
    ecust: ["华东理工大学", "华东理工", "上海", "上海", "east"],
    sufe: ["上海财经大学", "上海财大", "上海", "上海", "east"],
    nmmu: ["海军军医大学", "军医大学", "上海", "上海", "east"],
    ecnu: ["华东师范大学", "华东师大", "上海", "上海", "east"],
    uestc: ["电子科技大学", "电子科大", "成都", "四川", "west"],
    swjtu: ["西南交通大学", "西南交大", "成都", "四川", "west"],
    zju: ["浙江大学", "浙江大学", "杭州", "浙江", "east"]
  };

  const schoolMoments = {
    ustc: "聊聊大学里的第一场实验，再交换一份深夜学习补给清单",
    hfut: "认一遍新校园的路，把工科生的日常和高中趣事接着聊",
    ahnu: "沿着校园慢慢散步，听听未来老师眼里的大学新鲜事",
    ahu: "找一处安静角落坐下，把开学后的故事一次讲个够",
    hsu: "从校园生活聊到徽州山水，为下一段旅程留一张合影",
    ahmu: "听听医学课堂的新体验，也提醒彼此旅途中记得好好吃饭",
    ahpu: "看看创意如何从课堂走进生活，再讨论下一次见面的路线",
    cuc: "感受校园里的创作气息，顺便录一段班级旅行播报",
    buaa: "寻找校园里的航空航天元素，把这次碰头拍成出发照",
    cau: "聊聊田野、实验室和食物背后的故事，再认真吃好这一顿",
    xmu: "吹着海风交换近况，让这一站的校园漫步慢一点",
    hqu: "在闽南气息里逛逛校园，听一段跨地域的新生活",
    scut: "看看理工校园里的岭南日常，再研究今天该去哪个食堂窗口",
    sysu: "在南方树影里边走边聊，把分别后的故事一件件补回来",
    jnu: "听听多元校园里的新见闻，也给下一位同学写张旅行留言",
    hitsz: "感受年轻城市里的校园节奏，交换各自最近解锁的新技能",
    whu: "在校园里找一段适合散步的路，把高中回忆和新生活串起来",
    hust: "听听忙碌又充实的工科日常，再为这趟旅行补充一点能量",
    hzau: "聊聊自然、土地与校园生活，顺手收下一份真诚的接风建议",
    wtu: "看看设计与生活如何相遇，再挑一种最能代表今天的颜色",
    csu: "沿着校园走一圈，听同学讲讲长沙生活里最惊喜的部分",
    nenu: "在北国校园里慢慢叙旧，把新的目标和旧的约定都说一遍",
    seu: "感受南京校园的历史气息，再找个地方把近况聊到尽兴",
    nju: "在安静的人文气息里散步，交换最近读到、看到的新东西",
    jiangnan: "从校园美学聊到生活灵感，为这站旅行添一点江南想象",
    dlut: "迎着海风聊聊工程人的新日常，再一起规划下一段路线",
    qhu: "感受高原校园的开阔，把一路见闻讲给远方的老同学听",
    xjtu: "在古都校园里边走边聊，听听新学期最想完成的一件事",
    xidian: "交换最近学会的技术与趣事，再给班级旅行留下一个暗号",
    hitwh: "沿着海边城市的节奏逛校园，让工科故事也带一点海风",
    sdu: "在齐鲁校园里重续旧话题，再认真讨论哪顿饭最值得期待",
    ouc: "把海洋故事和高中回忆放在一起聊，收下一份青岛散步路线",
    shu: "在城市校园里交换新鲜见闻，再选一个地方拍下重逢合影",
    sjtu: "听听大学生活里的新挑战，也分享彼此最近完成的小目标",
    ecust: "从实验与创意聊到日常，把理工生活讲出一点烟火气",
    sufe: "聊聊数字之外的校园生活，再做一份不讲预算的晚饭计划",
    nmmu: "听听严谨充实的校园日常，也把老同学的关心认真收下",
    ecnu: "在校园里寻找一点浪漫日常，聊聊未来想成为怎样的大人",
    uestc: "交换科技校园里的新体验，再研究成都夜宵的正确打开方式",
    swjtu: "从轨道与远方聊到这趟旅行，顺手规划下一次同学会路线",
    zju: "沿着杭州校园慢慢走，把新目标和旧回忆都装进行囊"
  };

  const cityProfiles = {
    合肥: ["科创新章", "用一顿热乎的本地味道给旅途重新充电"],
    芜湖: ["江城晚风", "迎着江风找点地道小吃，让聊天再延长一会儿"],
    黄山: ["山水徽州", "把徽州风味和山水期待一起加入下一站计划"],
    北京: ["首都坐标", "在城市灯光亮起前，用一顿认真接风收尾"],
    厦门: ["海风来信", "吹着海风尝点闽南味道，把脚步放慢下来"],
    泉州: ["闽南烟火", "沿着古城气息找一份小吃，让这一站更有味道"],
    广州: ["岭南日常", "用烧腊或糖水结束行程，认真体验南方的热情"],
    深圳: ["城市新速度", "在夜色里找一顿痛快的饭，为下一站补满状态"],
    武汉: ["江城相逢", "把热干面和江湖气加入饭局，听故事讲到天黑"],
    长沙: ["热辣青春", "去找一份热闹夜宵，让重逢也带一点长沙温度"],
    长春: ["北国新页", "用一顿暖和的饭抵住晚风，慢慢听完彼此近况"],
    南京: ["金陵旧梦", "沿着梧桐树影找家小店，把六朝烟火带进饭局"],
    无锡: ["太湖清风", "尝一点江南味道，在轻松的晚饭里继续叙旧"],
    大连: ["滨城海风", "找一份带海味的晚饭，把旅途疲惫留在风里"],
    西宁: ["高原晴空", "用一顿扎实的西北味道，为远路补足力气"],
    西安: ["长安一程", "让面食和古都夜色接管晚饭，聊到忘记时间"],
    威海: ["海岸慢行", "在海风里找一顿舒服的饭，给这段相遇留白"],
    济南: ["泉城重逢", "循着泉城烟火找顿好饭，把近况慢慢说完"],
    青岛: ["山海之间", "吹过海风再去认真吃饭，收下一份城市散步建议"],
    上海: ["城市漫游", "在街灯亮起后开启一场小饭局，把故事继续写下去"],
    成都: ["松弛一刻", "在茶香和辣味之间选一个答案，让行程慢下来"],
    杭州: ["湖山新遇", "在江南夜色里找顿好饭，为今天画上温柔句号"]
  };

  const notePatterns = [
    ({ name, moment, flavor }) => `${name}把今天安排得明明白白：${moment}。最后，${flavor}。`,
    ({ name, moment, flavor }) => `这一站不赶时间。先跟着${name}${moment}，再${flavor}。`,
    ({ name, city, tag, moment }) => `刚到${city}，${name}就发来消息。今天的关键词是“${tag}”：${moment}。`,
    ({ name, moment, flavor }) => `校门口碰头成功。${name}提议${moment}；天黑之前，还要${flavor}。`,
    ({ name, moment, flavor }) => `背包先放一边，故事慢慢讲。和${name}一起${moment}，然后${flavor}。`,
    ({ name, city, tag, moment }) => `这不是普通的打卡。${name}带你${moment}，也把${city}的“${tag}”装进行程。`,
    ({ name, moment, flavor }) => `一见面就聊回高中。边走边听${name}说新鲜事，${moment}；最后${flavor}。`,
    ({ name, city, moment, flavor }) => `${city}这一站由${name}做主：${moment}。行程的收尾，是${flavor}。`
  ];

  const roster = [
    ["ustc", "熊晨翔"], ["hfut", "胡致"], ["hfut", "石鑫威"], ["hfut", "张景达"], ["hfut", "朱奥超"],
    ["ahnu", "石心蕾"], ["ahu", "石润松"], ["ahu", "张奥霖"], ["hsu", "周佳倩"], ["ahmu", "刘清"], ["ahpu", "张嘉睿"],
    ["cuc", "叶佳琪"], ["buaa", "祝东惠"], ["cau", "朱杞楠"],
    ["xmu", "石胜楠"], ["hqu", "黎媛媛"],
    ["scut", "石晋嘉"], ["scut", "石振兴"], ["scut", "张超樾"], ["sysu", "贺佳勇"], ["sysu", "黄伟明"], ["jnu", "涂瑞恒"], ["hitsz", "吴晨"],
    ["whu", "李嘉慧"], ["whu", "余脉"], ["hust", "宗瑾怡"], ["hzau", "陈霖"], ["wtu", "陈志峰"],
    ["csu", "陈旭"], ["csu", "杨方勇"], ["nenu", "吴佳妮"],
    ["seu", "洪若兮"], ["seu", "朱博铝"], ["nju", "谢昊"], ["nju", "杨乐"], ["jiangnan", "虞涛"],
    ["dlut", "唐柳"], ["dlut", "吴浩林"], ["qhu", "刘子云"],
    ["xjtu", "陶梓涵"], ["xidian", "孙宇帆"], ["xidian", "张博涵"],
    ["hitwh", "沈晓雨"], ["sdu", "王彬"], ["sdu", "徐翊睿"], ["sdu", "张子宇"], ["sdu", "赵宇翔"], ["ouc", "贺浩然"], ["ouc", "胡子吟"],
    ["shu", "王丽杰"], ["sjtu", "何俊浩"], ["ecust", "夏子强"], ["ecust", "周子根"], ["sufe", "石楷"], ["nmmu", "李博勋"], ["ecnu", "程胜"], ["ecnu", "朱飞华"],
    ["uestc", "冯皓"], ["swjtu", "廖展"], ["zju", "廖石博"]
  ];

  const classmates = roster.map(([schoolKey, name], index) => {
    const [school, short, city, province, region] = schoolDirectory[schoolKey];
    const [tag, flavor] = cityProfiles[city];
    const moment = schoolMoments[schoolKey];
    return {
      id: `${schoolKey}-${index + 1}`,
      name,
      school,
      short,
      city,
      province,
      region,
      tag,
      moment,
      flavor,
      note: notePatterns[index % notePatterns.length]({ name, school, city, tag, moment, flavor })
    };
  });

  const events = [
    { title: "高铁准点", body: "一路绿灯，还赶上了热乎的盒饭。", icon: "铁", effects: { tickets: 2 }, effectText: "+2 饭票" },
    { title: "候补成功", body: "出发前一分钟收到出票通知，运气站在你这边。", icon: "票", effects: { transport: 1 }, effectText: "+1 车票" },
    { title: "行李超重", body: "带给同学的特产实在太多，只好补交托运费。", icon: "箱", effects: { tickets: -2 }, effectText: "-2 饭票" },
    { title: "室友带饭", body: "同学的室友听说你来，也帮忙多带了一份。", icon: "饭", effects: { tickets: 2, friendship: 1 }, effectText: "+2 饭票 · +1 友谊" },
    { title: "早八突袭", body: "陪同学上了一节早八，困得忘记在第几座城市。", icon: "早", effects: { friendship: -1 }, effectText: "-1 友谊" },
    { title: "校园迷路", body: "导航把你带到了围墙另一边，只能打车绕行。", icon: "路", effects: { tickets: -1 }, effectText: "-1 饭票" },
    { title: "奶茶第二杯半价", body: "当然要给下一位遇见的老同学也带一杯。", icon: "茶", effects: { tickets: -1, friendship: 2 }, effectText: "-1 饭票 · +2 友谊" },
    { title: "学生证福利", body: "景点门票打折，省下的钱够多吃一顿。", icon: "证", effects: { tickets: 2 }, effectText: "+2 饭票" },
    { title: "暴雨晚点", body: "列车停在半路，今天的计划被迫重排。", icon: "雨", effects: { transport: -1 }, effectText: "-1 车票" },
    { title: "老同学报销", body: "对方坚持接风，这顿饭最终一张饭票都没花。", icon: "请", effects: { tickets: 1, friendship: 1 }, effectText: "+1 饭票 · +1 友谊" },
    { title: "毕业歌单", body: "随机播放到了高中常听的歌，车厢里突然安静了一会儿。", icon: "歌", effects: { friendship: 2 }, effectText: "+2 友谊" },
    { title: "特产交换", body: "背包又重了一点，但故事也多了一点。", icon: "礼", effects: { friendship: 1 }, effectText: "+1 友谊" }
  ];

  const memories = [
    { title: "课间十分钟", body: "有人提起那段永远不够用的课间。每位玩家说出一件高中小事，你获得回忆奖励。", icon: "忆", effects: { friendship: 2 }, effectText: "+2 友谊" },
    { title: "班级合影", body: "旧照片里每个人都比记忆中青涩。分享一个画面最清晰的瞬间。", icon: "照", effects: { friendship: 2 }, effectText: "+2 友谊" },
    { title: "老师语录", body: "模仿一句大家都熟悉的老师口头禅，成功逗笑一人即可。", icon: "言", effects: { friendship: 2 }, effectText: "+2 友谊" },
    { title: "同桌时光", body: "说出一件同桌曾经帮过你的事。记得感谢那些微小的善意。", icon: "桌", effects: { friendship: 2 }, effectText: "+2 友谊" }
  ];

  const objectives = [
    { id: "schools", title: "校园巡礼", description: "拜访 5 所不同大学", target: 5, reward: 4, metric: "visits" },
    { id: "provinces", title: "印章收藏家", description: "收集 4 个省份印章", target: 4, reward: 4, metric: "provinces" },
    { id: "east", title: "东部穿行", description: "拜访 3 所华东地区大学", target: 3, reward: 4, metric: "region", region: "east" },
    { id: "longtrip", title: "不怕路远", description: "拜访南方和北方各 1 所大学", target: 2, reward: 5, metric: "oppositeRegions" },
    { id: "friends", title: "饭局主理人", description: "累计获得 10 点基础友谊值", target: 10, reward: 4, metric: "friendship" }
  ];

  const hostsForCity = (city) => classmates.filter((student) => student.city === city).map((student) => student.id);
  const cityStop = (city) => ({ type: "school", label: city, short: city, hostIds: hostsForCity(city) });

  const board = [
    { type: "start", label: "高中", short: "起点", city: "出发地" },
    { type: "event", label: "出发好运", short: "事件" },
    cityStop("北京"),
    { type: "transport", label: "北方枢纽", short: "高铁" },
    cityStop("长春"),
    cityStop("大连"),
    cityStop("威海"),
    cityStop("青岛"),
    cityStop("济南"),
    { type: "event", label: "沿海列车", short: "事件" },
    cityStop("南京"),
    cityStop("无锡"),
    cityStop("上海"),
    cityStop("杭州"),
    { type: "transport", label: "华东换乘", short: "高铁" },
    cityStop("合肥"),
    cityStop("芜湖"),
    cityStop("黄山"),
    cityStop("武汉"),
    cityStop("长沙"),
    { type: "event", label: "南下旅途", short: "事件" },
    cityStop("广州"),
    cityStop("深圳"),
    cityStop("厦门"),
    cityStop("泉州"),
    { type: "transport", label: "西部换乘", short: "飞机" },
    cityStop("成都"),
    cityStop("西安"),
    cityStop("西宁"),
    { type: "memory", label: "毕业相册", short: "回忆" }
  ];

  const playerColors = ["#e94f37", "#16877d", "#3667b1", "#f2b134", "#8c5aa7", "#d96c91"];
  const data = { classmates, events, memories, objectives, board, playerColors };

  root.GAME_DATA = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis);
