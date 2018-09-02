const THEME = {
    RED: 'red',
    GREEN: 'green'
}

const IMAGE_DOMAIN = './demo/images/solar_terms'

export default (date:Date, almanac:any) => {
    let template;
    let theme = THEME.GREEN;
    
    if (almanac && almanac.error) {
        return
        // return `<div class="almanacPaper almanacPaper-noData js-reload">数据加载失败<br/>请点击任意处重试</div>`
    }

    //周末 节气  法定节假日 日历为红色
    if (almanac.jieqi.length > 0 || date.getDay() === 0 || date.getDay() === 6) {
        theme = THEME.RED;
    }

    template = `
        <div class="almanacPaper almanacPaper-${theme}">
            <div class="date">
                <div class="date_month">${date.getMonth() + 1}月</div>
                <div class="date_lunar">
                    ${almanac.bazi}<br/>
                    ${almanac.nongli}
                </div>
                <div class="date_week">
                    ${_getWeek(date)}<br/>
                    ${almanac.xingqi}
                </div>
                <div class="date_constellation">
                    ${_getConstellation(date)}<br/>
                    ${almanac.chongsha}
                </div>
            </div>
            <div class="almanacPaper_date">
                ${date.getDate()}
            </div>
            <div class="almanacPaper_body">
                <div class="suitable">
                    <div class="suitable_title">宜</div>
                    <div class="suitable_content">${formatYiAndJi(almanac.yi)}</div>
                </div>
                <div class="almanacPaper_content">
                    <div class="almanacPaper_solarTerms" style="background-image:url(${getSolarTermsImg(almanac, date)})">
                    </div>
                    <div class="pengZu">
                        <div class="pengZu_title">彭祖百忌<br /></div>
                        <div class="pengZu_content">${almanac.pengzubaiji}</div>
                    </div>
                    <div class="almanacPaper_gods">
                        <div class="godsItem godsItem-fetus">
                            <div class="godsItem_title">胎神</div>
                            <div class="godsItem_content">${almanac.jinritaishen}</div>
                        </div>
                        <div class="godsItem godsItem-elements">
                            <div class="godsItem_title">日五行</div>
                            <div class="godsItem_content">${formatWuXin(almanac.riwuxing)}</div>
                        </div>
                        <div class="godsItem godsItem-luckyGod">
                            <div class="godsItem_title">吉神方位</div>
                            <div class="godsItem_content">
                                财神${almanac.jishenfangwei.cai}<br/>
                                喜神${almanac.jishenfangwei.xi}<br/>
                                福神${almanac.jishenfangwei.fu}<br/>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="avoid">
                    <div class="avoid_title">忌</div>
                    <div class="avoid_content">${formatYiAndJi(almanac.ji)}</div>
                </div>
            </div>
            <div class="almanacPaper_footer">
                <div class="fortune fortune-lucky">
                    <div class="fortune_title">吉神宜趋</div>
                    <div class="fortune_content">${formatFortune(almanac.jishenyiqu)}</div>
                </div>
                <div class="fortune fortune-doom">
                    <div class="fortune_title">凶神宜忌</div>
                    <div class="fortune_content">${formatFortune(almanac.xiongshenyiji)}</div>
                </div>
            </div>
        </div>
    `

    return template;
}

function _getConstellation(date:Date) {
    const month = date.getMonth();
    const day = date.getDate();
    const constellations = [
        "魔蝎",
        "水瓶",
        "双鱼",
        "白羊",
        "金牛",
        "双子",
        "巨蟹",
        "狮子",
        "处女",
        "天秤",
        "天蝎",
        "射手",
        "魔蝎",
    ];
    const days = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];

    let index = month - (day < days[month] ? 1 : 0);

    return constellations[index + 1] + "座";
}

function _getWeek(date:Date) {
    const weekNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ]
    return weekNames[date.getDay()];
}

function formatYiAndJi(value:string) {
    let result = value
    //最对支持的行数，大于就截断
    let lineCount = 0;
    result = result.replace(/　/g, ' ');
    result = result.replace(/【/g, '');
    result = result.replace(/】/g, '');
    let resultArray = result.split(' ');

    result = resultArray.reduce((_result, item, index) => {
        if (lineCount >= 10) {
            return _result;
        }

        if (item.length > 2) {
            _result += `<div>${item}</div>`;
            lineCount += 1;
            return _result;
        }

        if ((index + 1) % 2 === 0) {
            _result += `${item}<br />`;
            lineCount += 1;
        } else {
            _result += `${item}&nbsp;&nbsp;`;
        }

        return _result;
    }, '')

    return result
}

function formatFortune(value:string) {
    return value.replace(/,/g, '&nbsp;&nbsp;')
    // let result = value;
    // result = result.split(',');
    // return result.reduce((_result,item)=>{
    //     return _result + `<span style="padding-right:5px">${item}</span>`
    // },'')

}

function formatWuXin(value:string[]) {
    return Array.from(value).reduce((result, currentValue) => {
        return `${result}${currentValue}<br />`
    }, '')
}

function getSolarTermsImg(almanac:any, date:Date) {
    return '';
    
    let solars = [
        { name: '立春', image: `${IMAGE_DOMAIN}/01-red.jpg` },
        { name: '雨水', image: `${IMAGE_DOMAIN}/02-red.jpg` },
        { name: '惊蛰', image: `${IMAGE_DOMAIN}/03-red.jpg` },
        { name: '春分', image: `${IMAGE_DOMAIN}/04-red.jpg` },
        { name: '清明', image: `${IMAGE_DOMAIN}/05-red.jpg` },
        { name: '谷雨', image: `${IMAGE_DOMAIN}/06-red.jpg` },
        { name: '立夏', image: `${IMAGE_DOMAIN}/07-red.jpg` },
        { name: '小满', image: `${IMAGE_DOMAIN}/08-red.jpg` },
        { name: '芒种', image: `${IMAGE_DOMAIN}/09-red.jpg` },
        { name: '夏至', image: `${IMAGE_DOMAIN}/10-red.jpg` },
        { name: '小暑', image: `${IMAGE_DOMAIN}/11-red.jpg` },
        { name: '大暑', image: `${IMAGE_DOMAIN}/12-red.jpg` },
        { name: '立秋', image: `${IMAGE_DOMAIN}/13-red.jpg` },
        { name: '处暑', image: `${IMAGE_DOMAIN}/14-red.jpg` },
        { name: '白露', image: `${IMAGE_DOMAIN}/15-red.jpg` },
        { name: '秋分', image: `${IMAGE_DOMAIN}/16-red.jpg` },
        { name: '寒露', image: `${IMAGE_DOMAIN}/17-red.jpg` },
        { name: '霜降', image: `${IMAGE_DOMAIN}/18-red.jpg` },
        { name: '立冬', image: `${IMAGE_DOMAIN}/19-red.jpg` },
        { name: '小雪', image: `${IMAGE_DOMAIN}/20-red.jpg` },
        { name: '大雪', image: `${IMAGE_DOMAIN}/21-red.jpg` },
        { name: '冬至', image: `${IMAGE_DOMAIN}/22-red.jpg` },
        { name: '小寒', image: `${IMAGE_DOMAIN}/23-red.jpg` },
        { name: '大寒', image: `${IMAGE_DOMAIN}/24-red.jpg` },
    ];

    let redImages = [`${IMAGE_DOMAIN}/default-1-red.jpg`, `${IMAGE_DOMAIN}/default-2-red.jpg`, `${IMAGE_DOMAIN}/default-3-red.jpg`, `${IMAGE_DOMAIN}/default-4-red.jpg`,]
    let greenImages = [`${IMAGE_DOMAIN}/default-1-green.jpg`, `${IMAGE_DOMAIN}/default-2-green.jpg`, `${IMAGE_DOMAIN}/default-3-green.jpg`, `${IMAGE_DOMAIN}/default-4-green.jpg`,]

    let solar = solars.find((item) => {
        return almanac.jieqi === item.name;
    });

    if (solar) {
        return solar.image
    }

    // TODO 判断是否法定节假日
    let isHoliday = date.getDay() === 0 || date.getDay() === 6;
    let defaultImages = isHoliday ? redImages : greenImages;

    return defaultImages[date.getDay() % 4];

}