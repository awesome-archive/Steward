/**
 * @file his command plugin script
 * @description 历史记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import browser from 'webextension-polyfill'

var version = 2;
var name = 'history';
var key = 'his';
var type = 'keyword';
var icon = browser.extension.getURL('img/history.png');
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

function searchHistory(cmdbox, key, callback) {
    browser.history.search({
        text: key

    }, function (hisList) {
            hisList = hisList || [];
            hisList = hisList.filter(function (his) {
                return !!his.title;
            });

            callback(hisList);
        });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: item.title,
            desc: item.url,
            url: item.url

        };
    });
}

function onInput(key) {
    var that = this;
    searchHistory(that, key, function (matchUrls) {
        that.showItemList(dataFormat(matchUrls));
    });
}

function onEnter(item) {
    browser.tabs.create({
        url: item.url
    });
}

export default {
    version,
    name: 'History',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};
