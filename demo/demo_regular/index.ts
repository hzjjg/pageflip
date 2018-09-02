import * as $ from 'jquery';
import './scss/index.scss';
import PageFlip from '../../src/pageFlip';
import mockData from './script/mock_almanac';
import renderAlmanac from './script/render_almanac'
import { parseDate, formatDate } from './script/utils';

class App {
    _date = new Date()
    //当前页日期
    date = ''
    //黄历缓存
    almanacCache = new Map()
    nextDate = ''
    prevDate = ''
    // 翻页的实例
    pageflip: PageFlip
    //加载错误的页面
    errorDates = new Map()
    // 正在重试请求
    retrying = false

    ele = {
        $almancWrap: $('.almanac_list'),
    }

    /**
     * 渲染当前页
     */
    renderCurrentPage() {   
        let $almancWrap = this.ele.$almancWrap;
        let currentDateEle = this.genAlmanacElement(this.date, this.almanacCache.get(this.date));
        $almancWrap.html('');
        $almancWrap.append(currentDateEle);
    }

    /**
     * 渲染相邻页面
     */
    renderNearByPage() {
        let $almancWrap = this.ele.$almancWrap;
        let almanacCache = this.almanacCache;
        let prevDate = this.prevDate;
        let nextDate = this.nextDate;

        let nextDayData = almanacCache.get(nextDate);
        let prevDayData = almanacCache.get(prevDate);

        let hasPrev = prevDayData && !prevDayData.error;
        let hasNext = nextDayData && !nextDayData.error;

        hasPrev && $almancWrap.prepend(this.genAlmanacElement(prevDate, prevDayData));
        hasNext && $almancWrap.append(this.genAlmanacElement(nextDate, nextDayData));

        if (hasPrev && hasNext) {
            this.resetPages(2);
        } else if (hasPrev && !hasNext) {
            this.resetPages(2);
        } else if (!hasPrev && hasNext) {
            this.resetPages(1);
        } else {
            this.resetPages(1);
        }
    }

    /**
     * 加载相邻天的数据
     */
    loadNearBy() {
        let prevDate = this.prevDate;
        let nextDate = this.nextDate;
        let complete = 0;

        return new Promise((resolve, reject) => {
            this.getAlmanac(nextDate).then((() => {
                complete++;
                complete === 2 && resolve();
            })).catch(() => {
                complete++;
                complete === 2 && reject();
            })

            this.getAlmanac(prevDate).then(() => {
                complete++;
                complete === 2 && resolve();
            }).catch(() => {
                complete++;
                complete === 2 && reject();
            })
        })
    }

    /**
     * 生成根据数据渲染后的模版
     * @param {data} date 日期
     * @param {almanac} almanac 黄历数据
     */
    genAlmanacElement(date: string, almanac: any) {
        let element = document.createElement('div');
        $(element).addClass('almanac_item');
        element.innerHTML = renderAlmanac(parseDate(date), almanac);
        return element;
    }

    /**
     * 当页面变化之后重置翻页
     * @param {number} page 要翻到的页数
     */
    resetPages(page: number) {
        let $pages = $('.almanac_item');
        this.pageflip.resetPages(Array.from($pages));
        this.pageflip.turnToPage(page);
    }

    /**
     * 事件监听
     */
    bindEvent() {
        window.addEventListener('resize', () => {
            //resize 后需要等待一会才能重新设置翻页的大小。110 的时候t9 正常，v6 偶尔会出现问题。
            this.fitHeight();
            setTimeout(() => {
                this.pageflip.resetPageSize();
            }, 150);
        }, false);

        //尝试翻页的时候加载数据
        $('.almanac_content').on('touchend', () => {
            setTimeout(() => {
                let cache = this.almanacCache;
                let data = cache.get(this.date);
                let nextDayData = cache.get(this.nextDate);
                let prevDayData = cache.get(this.prevDate);
                let date = this.date;

                //如果当前页无数据，重新加载;
                if (data && data.error) {
                    this.loadData();
                    return;
                }

                //前后页面加载错误，尝试再加载一次
                if (
                    (prevDayData && prevDayData.error) ||
                    (nextDayData && nextDayData.error)
                ) {

                    if (this.retrying) {
                        return;
                    }
                    this.retrying = true;
                    this.loadNearBy().then(() => {
                        this.retrying = false;
                        if (date === this.date && !this.pageflip.isDragging) {
                            this.renderCurrentPage();
                            this.renderNearByPage();
                        }
                    }).catch(() => {
                        this.retrying = false;
                    })
                }
            }, 150);

        })

        document.addEventListener('touchcancel', () => { this.visibilityChange() });

    }

    /**
     * 数据监听
     */
    bindData() {
        Reflect.defineProperty(this, 'date', {
            get() {
                return formatDate(this._date.getTime(), 'YYYYMMDD');
            },
            set(date) {
                this._date = parseDate(date);
            }
        })

        Reflect.defineProperty(this, 'nextDate', {
            get() {
                let date = new Date(this._date);
                date.setDate(date.getDate() + 1);
                return formatDate(date.getTime(), 'YYYYMMDD');
            }
        })

        Reflect.defineProperty(this, 'prevDate', {
            get() {
                let date = new Date(this._date);
                date.setDate(date.getDate() - 1);
                return formatDate(date.getTime(), 'YYYYMMDD');
            }
        })
    }

    /**
     * 加载页面当前日期的数据并渲染
     */
    loadData() {
        let date = this.date;
        this.ele.$almancWrap.html(`
            <div class="almanac_item">
                <div class="almanac_paper">
                    <div class="loader"></div>
                </div>
            </div>
            `)

        this.getAlmanac(date).then(() => {
            this.renderCurrentPage();
            this.loadNearBy().then(() => {
                this.renderNearByPage();
            }).catch(() => { })
        }).catch(() => {
            this.ele.$almancWrap.html(`
                <div class="almanacPaper almanacPaper-noData js-reload">
                    数据加载失败<br/>请点击重试
                </div>
                `)
        })
    }

    /**
     * 按日期加载黄历 生产环境接口数据为客户端预加载
     * @param {string} date 日期 YYYYMMDD
     */
    getAlmanac(date: string) {
        return new Promise((resolve, reject) => {

            let data = this.almanacCache.get(date);
            if (data && !data.error) {
                resolve();
                return;
            }

            this.fetchAlmanac(date)
                .then(data => {
                    this.almanacCache.set(date, data);
                    resolve();
                }).catch(data => {
                    if (!this.almanacCache.has(date)) {
                        this.almanacCache.set(date, data);
                    }
                    reject();
                })
        })
    }

    /**
     * 从接口获取信息   
     * @param {string} date 日期
     */
    fetchAlmanac(date: string) {
        //假装从接口返回
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(mockData)
            }, 200);
        })
    }

    //页面失去焦点
    visibilityChange() {
        this.resetPages(2);
    }

    /**
     * 翻页 页码变化完毕，但是动画还没执行完毕的时候，需完善
     * @param {number} page 页码
     * @param {number} oldPage 翻页前的页码
     */
    onFlipComplete(page: number, oldPage: number) {
        if (oldPage > page) {
            this.date = this.prevDate;
        }
        else if (oldPage < page) {
            this.date = this.nextDate;
        }
        else if (oldPage === page) {

        }

        this.renderAfterFlip();
    }

    /**
     * 判断屏幕比例，16:9 的则压缩日期高度
     */
    fitHeight() {
        let height = document.body.clientHeight;
        let width = document.body.clientWidth;

        // 美图v6
        if (height / width <= 565 / 360) {
            $('.almanac').addClass('h16w9');
        }

    }

    /**
     * 翻页动画结束之后渲染页面
     */
    renderAfterFlip() {
        setTimeout(() => {
            let date = this.date;
            this.loadNearBy().then(() => {
                if (date === this.date && !this.pageflip.isDragging) {
                    this.renderCurrentPage();
                    this.renderNearByPage();
                }
            }).catch(() => { })
        }, 100);
    }

    /**
     * 初始化书本
     */
    initPageflip() {
        this.pageflip = new PageFlip(
            {
                book: $('.almanac_content')[0],
                pages: Array.from($('.almanac_item')),
                onFlipComplete: (page, oldPage) => {
                    this.onFlipComplete(page, oldPage);
                }
            }
        );
    }

    /**
     * 初始化
     */
    init() {
        this.date = formatDate(new Date().getTime(), 'YYYYMMDD');

        this.bindData();

        this.fitHeight();

        this.initPageflip();

        this.bindEvent();

        this.loadData();
    }
}

new App().init();
