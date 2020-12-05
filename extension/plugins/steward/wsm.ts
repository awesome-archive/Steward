/**
 * @description Steward websites manager
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import axios from 'axios';
import dayjs from 'dayjs';

import { StewardApp } from 'common/type';
import util from 'common/util';
import constant from 'constant/index';
import { getURL } from 'helper/extension.helper';
import { t } from 'helper/i18n.helper';
import websitesHelper from 'helper/websites.helper';
import { Command, Plugin } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 1;
  const name = 'wsm';
  const type = 'keyword';
  const icon = getURL('img/icon.png');
  const title = t(`${name}_title`);
  const subtitle = t(`${name}_subtitle`);
  const commands: Command[] = [
    {
      key: 'wsm',
      type,
      title,
      subtitle,
      icon,
    },
  ];

  const subCommandKeys = ['install', 'uninstall', 'list'];
  const subCommands: any[] = subCommandKeys.map(item => {
    return {
      key: 'plugins',
      universal: true,
      id: `wsm ${item}`,
      icon,
      title: t(`${name}_${item}_title`),
      desc: t(`${name}_${item}_subtitle`),
    };
  });

  const LIST_URL =
    'https://raw.githubusercontent.com/Steward-launcher/steward-websites/master/data.json';

  let websites;

  function initWebsites() {
    if (!websitesHelper.inited) {
      console.log('init helper...');
      websitesHelper.init().then(() => {
        websitesHelper.inited = true;
      });

      if (Steward.inContent) {
        subCommands.push({
          id: 'create',
          icon,
          title: t(`${name}_create_title`),
          desc: t(`${name}_create_subtitle`),
        });
      }
    }
  }

  function filterWebsites(list, query) {
    if (query) {
      return list.filter(item => {
        return util.matchText(query, item.title + item.host);
      });
    } else {
      return list;
    }
  }

  function queryWebsites(query) {
    if (websites) {
      return Promise.resolve(filterWebsites(websites, query));
    } else {
      return axios
        .get(LIST_URL, {
          params: {
            t: dayjs().format('YYYYMMDD'),
          },
        })
        .then(results => {
          const items = results.data.websites;

          websites = items;

          return filterWebsites(websites, query);
        });
    }
  }

  function getStatusText(status) {
    if (status === constant.BASE.WEBSITE_STATUS.INSTALLED) {
      return '✓';
    } else if (status === constant.BASE.WEBSITE_STATUS.NEWVESION) {
      return '↑';
    }
  }

  function dataFormat(list, subcmd) {
    return list.map(item => {
      let desc = `${item.host} -- by ${item.author}`;
      let status;

      if (subcmd === 'install') {
        status = websitesHelper.checkWebsiteStatus(item);

        const result = getStatusText(status);

        if (result) {
          desc = `${result} ${desc}`;
        }
      }

      return {
        id: item._id,
        icon: item.icon,
        title: item.title,
        desc,
        status,
        data: item,
        subcmd,
      };
    });
  }

  function queryInstalledWebsites(query) {
    return websitesHelper.init().then(list => {
      return filterWebsites(list, query);
    });
  }

  function onInput(query) {
    const cmdstr = query.trim();
    const arr = cmdstr.split(' ');
    const subcmd = arr[0];
    const subquery = arr[1] || '';

    initWebsites();
    if (subCommandKeys.includes(subcmd)) {
      if (subcmd === 'list' || subcmd === 'install') {
        return queryWebsites(subquery).then(list => {
          return dataFormat(list, subcmd);
        });
      } else if (subcmd === 'uninstall') {
        return queryInstalledWebsites(subquery).then(list => {
          return dataFormat(list, subcmd);
        });
      }
    } else {
      return Promise.resolve(
        subCommands.filter(cmd => cmd.id.indexOf(query) !== -1),
      );
    }
  }

  function installWebsite(item, status) {
    if (status === constant.BASE.WEBSITE_STATUS.NOTINSTALL) {
      return websitesHelper.create(item).then(() => {
        util.toast.success('Website has been installed successfully!');
      });
    } else if (status === constant.BASE.WEBSITE_STATUS.NEWVESION) {
      return websitesHelper.update(item).then(() => {
        util.toast.success('Website has been updated successfully!');
      });
    } else {
      util.toast.warning('Website has been installed');

      return false;
    }
  }

  function uninstallWebsite(item) {
    return websitesHelper.remove(item.id).then(() => {
      util.toast.success('Uninstall successfully!');
    });
  }

  function createWebsite(data) {
    const status = websitesHelper.checkWebsiteByHost(data.host);

    if (status === constant.BASE.WEBSITE_STATUS.NOTINSTALL) {
      websitesHelper
        .create(
          Object.assign(websitesHelper.getDefaultSiteInfo(data), {
            author: 'solobat',
            version: 1,
            isDefault: false,
          }),
        )
        .then(() => {
          const baseURL = getURL('options.html');

          chrome.tabs.create({
            url: `${baseURL}?tab=websites`,
          });

          util.toast.success('Create successfully');
          return 3000;
        });
    } else {
      util.toast.warning(
        'The configuration of the current site already exists',
      );
      return Promise.resolve(3000);
    }
  }

  function onEnter(item) {
    const subcmd = item.subcmd;

    if (item.subcmd) {
      if (subcmd === 'install') {
        const result = installWebsite(item.data, item.status);

        if (result) {
          return result.then(() => {
            Steward.app.refresh();

            return true;
          });
        } else {
          return Promise.resolve(true);
        }
      } else if (subcmd === 'uninstall') {
        return uninstallWebsite(item.data).then(() => {
          Steward.app.refresh();

          return true;
        });
      }
    } else if (item.id === 'create') {
      return createWebsite(Steward.data.page);
    }
  }

  return {
    version,
    name: 'Steward Websites Manager',
    category: 'steward',
    type,
    icon,
    title,
    onInput,
    onEnter,
    commands,
    canDisabled: false,
  };
}
