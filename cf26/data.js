(function (root) {
  "use strict";

  const classmates = [
    { id: "sdu-qd", name: "张子宇", school: "山东大学 青岛校区", short: "山大青岛", city: "青岛", province: "山东", region: "east", tag: "山海之间", note: "张子宇把海风也写进了接站计划：先逛一圈山东大学青岛校区，交换各自的新生活，再用一顿带着青岛味道的晚饭给旅途补充能量。" },
    { id: "hit", name: "吴晨", school: "哈尔滨工业大学 本部", short: "哈工大", city: "哈尔滨", province: "黑龙江", region: "north", tag: "北国来信", note: "穿过哈尔滨的风，吴晨已经在哈工大等你。今天不赶路，先听听工科校园里的新鲜事，再找一顿热乎的饭把一路寒意留在门外。" },
    { id: "ecnu", name: "朱飞华", school: "华东师范大学 闵行校区", short: "华东师大", city: "上海", province: "上海", region: "east", tag: "城市漫游", note: "朱飞华带你沿着华东师大闵行校区慢慢散步，聊聊未来想成为怎样的大人。街灯亮起后，再开启一场属于老同学的小饭局。" },
    { id: "ustc", name: "熊晨翔", school: "中国科学技术大学", short: "中国科大", city: "合肥", province: "安徽", region: "central", tag: "科创新章", note: "刚到合肥，熊晨翔就发来碰头坐标。先去中国科大听一段实验室与大学生活的新故事，再用一顿热乎的本地味道给旅行重新充电。" },
    { id: "uestc", name: "冯皓", school: "电子科技大学 清水河校区", short: "电子科大", city: "成都", province: "四川", region: "west", tag: "松弛一刻", note: "银杏道旁碰头成功。冯皓准备带你看看电子科大清水河校区的新日常，交换最近解锁的技能，最后再研究成都夜宵的正确打开方式。" },
    { id: "nju-yang", name: "杨乐", school: "南京大学 鼓楼校区", short: "南大·杨", city: "南京", province: "江苏", region: "east", tag: "金陵旧梦", note: "这一站由杨乐做主：在南大鼓楼校区找一段安静的路，把分别后的故事慢慢补回来，再沿着南京梧桐树影寻找今天的晚饭。" },
    { id: "sjtu", name: "何俊浩", school: "上海交通大学 闵行校区", short: "上海交大", city: "上海", province: "上海", region: "east", tag: "城市漫游", note: "校园很大，但何俊浩不会让你迷路。跟着他逛过上海交大闵行校区，听听大学里的新挑战，再去城市夜色里找一顿认真接风。" },
    { id: "nju-xie", name: "谢昊", school: "南京大学 鼓楼校区", short: "南大·谢", city: "南京", province: "江苏", region: "east", tag: "金陵旧梦", note: "同一座南大鼓楼校区，谢昊准备了另一条路线。边走边交换最近读到的新东西，然后解锁一份只有熟人才知道的南京饭局菜单。" },
    { id: "seu", name: "洪若兮", school: "东南大学 四牌楼校区", short: "东南大学", city: "南京", province: "江苏", region: "east", tag: "金陵旧梦", note: "洪若兮在东南大学四牌楼校区等你。先感受校园里的历史气息，再拍一张重逢合影，把近况一直聊到食堂准备打烊。" },
    { id: "zju", name: "廖石博", school: "浙江大学 紫金港校区", short: "浙江大学", city: "杭州", province: "浙江", region: "east", tag: "湖山新遇", note: "廖石博把杭州这一站安排得很松弛：沿着浙大紫金港校区慢慢认路，交换新的目标与旧的回忆，再去江南夜色里找顿好饭。" },
    { id: "dlut", name: "吴浩林", school: "大连理工大学 凌水校区", short: "大连理工", city: "大连", province: "辽宁", region: "north", tag: "滨城海风", note: "迎着海风抵达凌水，吴浩林已经准备好大连理工的校园路线。工程人的新日常聊完，再用一顿带海味的晚饭补满体力。" },
    { id: "xjtu", name: "陶梓涵", school: "西安交通大学 兴庆校区", short: "西安交大", city: "西安", province: "陕西", region: "west", tag: "长安一程", note: "陶梓涵带你走进西安交大兴庆校区，听听新学期最想完成的一件事。天黑之后，让古都夜色和一碗面接管剩下的行程。" },
    { id: "sysu", name: "黄伟明", school: "中山大学 深圳校区", short: "中大深圳", city: "深圳", province: "广东", region: "south", tag: "城市新速度", note: "这一站不只是打卡。黄伟明带你感受中大深圳校区的新节奏，把分别后的故事一件件补回来，再去深圳夜色里痛快吃一顿。" },
    { id: "buaa", name: "祝东惠", school: "北京航空航天大学 沙河校区", short: "北航", city: "北京", province: "北京", region: "north", tag: "首都坐标", note: "祝东惠在北航沙河校区发来接站消息。先寻找校园里的航空航天元素，把重逢拍成出发照，再用一顿北京饭局认真收尾。" },
    { id: "ouc", name: "贺浩然", school: "中国海洋大学 西海岸校区", short: "中国海大", city: "青岛", province: "山东", region: "east", tag: "山海之间", note: "贺浩然把海洋故事和高中回忆放在一起聊。逛过中国海大西海岸校区，再吹着海风收下一份青岛散步与美食清单。" },
    { id: "sdu-jn", name: "王彬", school: "山东大学 济南校区", short: "山大济南", city: "济南", province: "山东", region: "east", tag: "泉城重逢", note: "王彬在山东大学济南校区等你。先把高中没讲完的话题接上，再循着泉城烟火找顿好饭，让这张饭票花得格外值得。" },
    { id: "scut", name: "石振兴", school: "华南理工大学 大学城校区", short: "华南理工", city: "广州", province: "广东", region: "south", tag: "岭南日常", note: "石振兴带你在华南理工大学城校区认路，看看理工校园里的岭南日常。最后用烧腊或糖水完成接头，把南方热情装进行囊。" }
  ];

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

  const board = [
    { type: "start", label: "高中", short: "起点", city: "出发地" },
    { type: "event", label: "出发好运", short: "事件" },
    { type: "school", schoolId: "buaa" },
    { type: "event", label: "北上旅途", short: "事件" },
    { type: "school", schoolId: "hit" },
    { type: "transport", label: "东北换乘", short: "高铁" },
    { type: "school", schoolId: "dlut" },
    { type: "school", schoolId: "ouc" },
    { type: "school", schoolId: "sdu-qd" },
    { type: "event", label: "沿海列车", short: "事件" },
    { type: "school", schoolId: "sdu-jn" },
    { type: "transport", label: "南京南站", short: "换乘" },
    { type: "school", schoolId: "nju-yang" },
    { type: "school", schoolId: "seu" },
    { type: "school", schoolId: "nju-xie" },
    { type: "event", label: "沪宁线上", short: "事件" },
    { type: "school", schoolId: "ecnu" },
    { type: "school", schoolId: "sjtu" },
    { type: "school", schoolId: "zju" },
    { type: "transport", label: "杭州东站", short: "高铁" },
    { type: "school", schoolId: "ustc" },
    { type: "memory", label: "旧日回声", short: "回忆" },
    { type: "school", schoolId: "scut" },
    { type: "school", schoolId: "sysu" },
    { type: "transport", label: "南方枢纽", short: "飞机" },
    { type: "school", schoolId: "uestc" },
    { type: "event", label: "翻越秦岭", short: "事件" },
    { type: "school", schoolId: "xjtu" },
    { type: "memory", label: "毕业相册", short: "回忆" },
    { type: "rest", label: "返校补给", short: "补给" }
  ];

  const playerColors = ["#e94f37", "#16877d", "#3667b1", "#f2b134", "#8c5aa7", "#d96c91"];
  const data = { classmates, events, memories, objectives, board, playerColors };

  root.GAME_DATA = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis);
