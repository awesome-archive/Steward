/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'
import browser from 'webextension-polyfill'

var version = 2;
var name = 'openurl';
var key = 'open';
var type = 'regexp';
var icon = browser.extension.getURL('img/openurl.png');
var title = browser.i18n.getMessage(name + '_title');
var subtitle = browser.i18n.getMessage(name + '_subtitle');
var withoutKey = true;
var regExp = /^(https?:\/\/)?(www\.)?(\w+\.)+\w{2,5}$/gi;
var commands = [{
    key,
    title,
    type,
    subtitle,
    icon,
    editable: false,
    regExp
}];

function onInput(url) {
    var data = [{
        key: 'url',
        id: name,
        icon,
        title: url,
        desc: subtitle,
        url
    }];

    return data;
}

function onEnter({ url }) {
    if (!/^https?/.test(url)) {
        url = 'http://' + url;
    }
    browser.tabs.create({
        url
    });
}

export default {
    version,
    name: 'Open Url',
    icon,
    title,
    onInput,
    onEnter,
    commands
};