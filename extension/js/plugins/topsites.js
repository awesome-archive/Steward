/**
 * @file bm command plugin script
 * @description 书签记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import browser from 'webextension-polyfill'

var version = 2;
var name = 'topsites';
var key = 'site';
var type = 'keyword';
var icon = browser.extension.getURL('img/topsites.png');
var title = browser.i18n.getMessage(name + '_title');
var subtitle = browser.i18n.getMessage(name + '_subtitle');
var commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function onInput(key) {
    var that = this;
    browser.topSites.get(function (sites) {
        var arr = [];
        for (var i in sites) {
            var item = sites[i];
            arr.push({
                key: key,
                id: item.id,
                icon: icon,
                url: item.url,
                title: item.title,
                desc: item.url,
                isWarn: false
            });
        }
        that.showItemList(arr);
    });
}

function onEnter({ url }) {
    browser.tabs.create({
        url
    });
}

export default {
    version,
    name: 'Top Sites',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};