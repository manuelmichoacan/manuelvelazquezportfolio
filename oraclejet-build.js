module.exports = {
  copyCustomLibsToStaging: {
    fileList: [
      {
        cwd: 'node_modules/aws-amplify/dist',
        src: ['aws-amplify.js'],
        dest: 'web/js/libs/aws-amplify'
      }
    ]
  }
};