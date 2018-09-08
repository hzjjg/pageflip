# pageflip
项目中写的翻书效果

[简单demo](https://hzjjg.github.io/pageflip/dist/demo_simple.html)  
[应用实例](https://hzjjg.github.io/pageflip/dist/demo_regular.html)

## install and run

```js
    npm install
    npm run start
```

## build
```js
    npm run build
```

## usage
```ts
    new PageFlip({
        book:$('.book')[0],
        pages:Array.from($('.page')),
    })
```

## apis
```ts

    import PageFlip from 'path/to/file/pageFlip'

    //新建实例
    new PageFlip({
        /** 书本的dom */
        book: HTMLElement;

        /** 页面的dom */
        pages: HTMLElement[];

        /** 翻页释放时的速度 0 - 1 */
        flipSpeed?: number;

        /** 到达需要翻页时候的速度 px/ms */
        flipMoveSpeed?: number;

        /** 翻页力度，音响翻页的高度 */
        flipStrength?: number;

        /** 翻页的背景色 */
        flipColor?:string;

        /** 单双页 */
        // display?: DisplayType;

        /** 翻页页面页码变化的回调 */
        onFlipComplete?: (page:number,oldPage:number):any;
    })

    //是否正在拖动
    isDragging():boolean

    //翻到某页
    turnToPage(page:number,isAnimal?:boolean):void

    //启用翻页
    enbleFlip():void

    //禁止翻页
    disableFlip():void

    //重置分页
    resetPages(pages:HTMLElement):void

    //重设页面大小 TODO 待优化成自动重设
    resetPageSize():void

```


目前仅适配移动，请使用调试工具的手机模式查看demo。   
目前仅仅满足此前项目需要，仍有大量需要优化。
