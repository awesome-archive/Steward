/**
 * @description disable extensions/apps
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../../common/util'

const version = 2;
const name = 'offExtension';
const key = 'off';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/off.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    allowBatch: true,
    editable: true
}];

function setEnabled(id, enabled) {
    return new Promise(resolve => {
        chrome.management.setEnabled(id, enabled, function () {
            resolve('done');
        });
    });
}

function getExtensions(query, enabled, callback) {
    chrome.management.getAll(function (extList) {
        const matchExts = extList.filter(function (ext) {
            return ext.type === 'extension'
                && util.matchText(query, ext.name) && ext.enabled === enabled;
        });

        callback(matchExts);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        const url = item.icons instanceof Array ? item.icons[item.icons.length - 1].url : '';
        const isWarn = item.installType === 'development';

        return {
            key,
            id: item.id,
            icon: url,
            title: item.name,
            desc: item.description,
            isWarn
        };
    });
}

function onInput(query) {
    return new Promise(resolve => {
        getExtensions(query.toLowerCase(), true, function (matchExts) {
            resolve(dataFormat(matchExts));
        });
    });
}

const disableExecs = [
    item => {
        const result = setEnabled(item.id, false);

        window.slogs.push(`Disable: ${item.title}`);

        return result;
    },
    item => {
        const result = setEnabled(item.id, false);

        window.slogs.push(`Disable: ${item.title}`);

        return result;
    }
];

const extId = chrome.runtime.id;

function getSortedList(list) {
    const extIndex = list.findIndex(item => item.id === extId);

    list.splice(extIndex, 1);

    return list;
}

function onEnter(item, command, query, { shiftKey }, list) {
    let items;

    if (item instanceof Array) {
        items = getSortedList(item);
    } else {
        items = item;
    }

    const tasks = util.batchExecutionIfNeeded(shiftKey, disableExecs, [list, items]);
    return tasks.then(() => {
        window.stewardApp.refresh();
    });
}

export default {
    version,
    name: 'Disable Extension',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
