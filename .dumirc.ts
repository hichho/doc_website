import { defineConfig } from 'dumi';
import { title } from './.dumi/global';
import navConfig from './script/navConfig.json';

function getNavConfig() {
  return [...navConfig, { title: '搜索', link: '/search' }];
}

console.log(getNavConfig())

export default defineConfig({
  themeConfig: {
    name: title,
    logo: '/docWebsite/logo.png',
    nav: getNavConfig(),
    footer: 'build by fe',
  },
  base: '/docWebsite/',
  publicPath: '/docWebsite/',
  history: { type: 'browser' },
});
