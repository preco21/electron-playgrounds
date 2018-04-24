const {promisify} = require('util');
const webpack = require('webpack');
const execa = require('execa');
const treeKill = require('tree-kill');
const exitHook = require('exit-hook');
const webpackConfig = require('../webpack.config');

const treeKillP = promisify(treeKill);

const instances = new Set();
const compiler = webpack(webpackConfig({dev: true}));

compiler.watch({}, async (err, stats) => {
  // eslint-disable-next-line no-console
  console.log(stats.toString({
    chunks: false,
    modules: false,
    colors: true,
  }));

  if (err) {
    return;
  }

  await killInstancesIfExists();
  const instance = execa('electron', ['.'], {
    stdio: 'inherit',
    env: {
      ELECTRON_ENABLE_LOGGING: true,
    },
  });

  instances.add(instance);
  instance.on('exit', () => instances.delete(instance));
});

exitHook(killInstancesIfExists);

function killInstancesIfExists() {
  return Promise.all(
    Array.from(instances)
      .map(async (inst) => {
        await treeKillP(inst.pid);
        instances.delete(inst);
      }),
  );
}
