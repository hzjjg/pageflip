import * as $ from 'jquery';
import PageFlip from '../../src/pageFlip';
import './index.scss';

class App{
    init(){
        new PageFlip({
            book:$('.book')[0],
            pages:Array.from($('.page')),
        })
    }
}

new App().init();