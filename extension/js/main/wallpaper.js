import $ from 'jquery'
import CONST from '../constant'
import * as api from '../api/index'
import * as date from '../utils/date'
import Toast from 'toastr'
import { saveWallpaperLink, shouldShow } from '../helper/wallpaper'
import browser from 'webextension-polyfill'
import 'jquery.waitforimages'
import { getAllSources, getSources } from '../helper/wallpaperSource'

const $body = $('body');
const sourcesInfo = getAllSources();

let curUrl = '';
let state;
let timer = 0;

function updateSaveStatus(action) {
    const conf = saveActionConf[action];

    saveWallpaperLink(curUrl, conf.action).then(() => {
        Toast.success(conf.msg);
        let isNew;

        if (action === 'save') {
            window.stewardApp.emit('wallpaper:save');
            isNew = false;
        } else {
            window.stewardApp.emit('wallpaper:remove');
            isNew = true;
        }

        window.stewardApp.emit('wallpaper:refreshed', isNew);
    }).catch(msg => {
        Toast.warning(msg);
    });
}

export function save() {
    updateSaveStatus('save');
}

export function remove() {
    updateSaveStatus('remove');
}

export function update(url, toSave, isNew) {
    if (!url) {
        return;
    }

    if (toSave) {
        window.localStorage.setItem(CONST.STORAGE.WALLPAPER, url);
    }

    curUrl = url;
    let styles;

    if (url.startsWith('#')) {
        styles = {
            '--app-newtab-background-image': url,
            '--newtab-background-color': url
        };
    } else {
        styles = {
            '--app-newtab-background-image': `url(${url})`
        };
    }

    $('html').css(styles);
    window.stewardApp.emit('wallpaper:refreshed', isNew);
    $body.waitForImages(true).done(function() {
        Toast.clear();
        state.loading = false;
    });
}

function recordSource(source) {
    window.localStorage.setItem('wallpaper_source', source);
}

export function refresh(today, silent) {
    const method = today ? 'today' : 'rand';
    const server = getSources(method);

    if (!silent) {
        Toast.info(chrome.i18n.getMessage('wallpaper_update'), { timeOut: 20000 });
    }

    state.loading = true;

    return Promise.all(server.tasks.map(task => task())).then(sources => {
        // `result` will never be `favorites`.
        const [result, favorites] = sources;
        let type = server.name;

        if (type === 'favorites' && favorites.length === 0) {
            type = 'bing';
        }

        let wp;
        let isNew;

        if (type === 'favorites') {
            wp = sourcesInfo[type].handle(favorites);
            isNew = false;
        } else {
            wp = sourcesInfo[type].handle(result);
            isNew = favorites.indexOf(wp) === -1;
        }

        if (!/\.html$/.test(wp)) {
            shouldShow(wp).then(() => {
                recordSource(type);

                return update(wp, true, isNew, type);
            }).catch(() => {
                refresh(false, true);
            });
        } else {
            state.loading = false;
            Toast.clear();
            Toast.warning('Picture error, please refresh again.');
        }
    }).catch(resp => {
        console.log(resp);
        state.loading = false;
        Toast.clear();
    });
}

const saveActionConf = {
    save: {
        action: 'save',
        msg: chrome.i18n.getMessage('wallpaper_save_done')
    },

    remove: {
        action: 'remove',
        msg: chrome.i18n.getMessage('wallpaper_remove_done')
    }
};

function bindEvents() {
    document.addEventListener('stewardReady', event => {
        const app = event.detail.app;

        app.on('beforeleave', () => {
            console.log('beforeleave');
            clearInterval(timer);
        });
    });
}

export function init() {
    // restore
    const lastDate = new Date(window.localStorage.getItem(CONST.STORAGE.LASTDATE) || Number(new Date()));
    const defaultWallpaper = window.localStorage.getItem(CONST.STORAGE.WALLPAPER);
    const enableRandomWallpaper = window.stewardCache.config.general.enableRandomWallpaper;

    state = window.stewardCache.wallpaper = {
        loading: false
    };

    window.localStorage.setItem(CONST.STORAGE.LASTDATE, date.format());

    if (!defaultWallpaper) {
        refresh();
    } else {
        if (date.isNewDate(new Date(), lastDate) && enableRandomWallpaper) {
            refresh(true);
        } else {
            browser.storage.sync.get(CONST.STORAGE.WALLPAPERS).then(resp => {
                const list = resp[CONST.STORAGE.WALLPAPERS] || [];
                const isNew = list.indexOf(defaultWallpaper) === -1;

                update(defaultWallpaper, false, isNew);
            });
        }
    }

    api.picsum.refreshPicsumList();
    bindEvents();

    // set interval
    if (enableRandomWallpaper) {
        timer = setInterval(refresh, CONST.NUMBER.WALLPAPER_INTERVAL);
    } else {
        console.log('disable random');
    }
}