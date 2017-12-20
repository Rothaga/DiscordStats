module.exports = function(grunt) {
  grunt.initConfig({
    pkg:grunt.file.readJSON('package.json'),
    karma:{
      unit:{
        configFile: 'karma.conf.js'
      }
    },
    env:{
        dev:{
            NODE_ENV:'DEVELOPMENT'

        },
        prod:{
            NODE_ENV:'PRODUCTION'
        }
    },
    preprocess:{
      dev:{
          src:'./assets/views/indexTemplate.html',
          dest:'./assets/views/index.html'
      },
      prod:{
          src:'./assets/views/indexTemplate.html',
          dest:'./assets/views/index.html'
      }
    },
    cssmin:{
      target:{
        files:[{
          'assets/production/css/production.min.css':[
              'assets/vendor/bower_components/angular-material/angular-material.css',
              'assets/vendor/bower_components/bootstrap/dist/css/bootstrap.css',
              'assets/css/*.css'
            ]
        }]
      }
    },
    uglify:{
      options:{
        compress:{
          drop_console:true
        }
      },
      my_target:{
        files:{
          'assets/production/js/production.min.js':[
            "assets/vendor/bower_components/jquery/dist/jquery.js",
            "assets/vendor/bower_components/momentjs/moment.js",
            "assets/vendor/bower_components/bootstrap/dist/js/bootstrap.js",
            "assets/vendor/bower_components/fastclick/lib/fastclick.js",
            "assets/vendor/bower_components/angular/angular.js",
            "assets/vendor/bower_components/angular-aria/angular-aria.js",
            "assets/vendor/bower_components/angular-animate/angular-animate.js",
            "assets/vendor/bower_components/angular-material/angular-material.js",
            "assets/vendor/bower_components/angular-route/angular-route.js",
            "assets/js/main.js",
            "assets/js/services/*.js",
            "assets/js/controllers/*.js",
            "assets/js/directives/stickToBottom.js"
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-preprocess');

  grunt.registerTask('default', []);
  grunt.registerTask('dev', ['env:dev', 'preprocess:dev']);
  grunt.registerTask('prod', ['cssmin', 'uglify', 'env:prod', 'preprocess:prod']);
};
