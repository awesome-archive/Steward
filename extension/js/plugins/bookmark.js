/**
 * @file bm command plugin script
 * @description 书签记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import browser from 'webextension-polyfill'

var version = 2;
var name = 'bookmark';
var key = 'bm';
var type = 'keyword';
var icon = browser.extension.getURL('img/bookmark.png');
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


function searchBookmark(cmdbox, key, callback) {
    if (!key) {
        browser.bookmarks.getRecent(10, function (bookMarkList) {
            callback(bookMarkList || []);
        });

        return;
    }

    browser.bookmarks.search(key, function (bookMarkList) {
        bookMarkList = bookMarkList || [];

        bookMarkList = bookMarkList.filter(function (bookmark) {
            return bookmark.url !== undefined;
        });

        callback(bookMarkList);
    });
}

function onInput(key) {
    var that = this;
    searchBookmark(that, key, function (bookMarkList) {
        var arr = [];
        for (var i in bookMarkList) {
            var item = bookMarkList[i];
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

function onEnter(item) {
    browser.tabs.create({
        url: item.url
    });
}

export default {
    version,
    name: 'Bookmarks',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};