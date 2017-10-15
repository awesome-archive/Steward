/**
 * @file run command plugin script
 * @description 启动指定应用
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'
import browser from 'webextension-polyfill'

var version = 2;
var name = 'runapp';
var key = 'run';
var type = 'keyword';
var icon = browser.extension.getURL('img/app.png');
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

function getExtensions(key, callback) {
    browser.management.getAll(function (extList) {
        var data = extList.filter(function (ext) {
            return util.matchText(key, ext.name) && ext.isApp;
        });

        callback(data);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        var url = item.icons instanceof Array ? item.icons[0].url : '';
        var isWarn = item.installType === 'development';
        return {
            key: key,
            id: item.id,
            icon: url,
            title: item.name,
            desc: item.description,
            isWarn: isWarn

        };
    });
}

function onInput(key) {
    var that = this;
    getExtensions(key.toLowerCase(), function (data) {
        that.showItemList(dataFormat(data));
    });
}

function launch(id) {
    browser.management.setEnabled(id, true, function () {
        browser.management.launchApp(id, function () {});
    });
}

function onEnter({ id }) {
    launch(id);
    this.refresh();
}

export default {
    version,
    name: 'Run App',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};
