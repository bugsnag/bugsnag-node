module.exports = (grunt) ->
  # Configuration
  grunt.initConfig
    # Package information
    pkg: grunt.file.readJSON "package.json"

    # Coffeescript compilation
    coffee:
      glob_to_multiple:
        expand: true
        cwd: "src/"
        src: ["*.coffee"]
        dest: "lib/"
        ext: ".js"
      options:
        bare: true

    # Version bumping
    bump:
      options: part: "patch"
      files: ["package.json"]

    mochaTest:
      files: ["test/*.coffee"]
      options:
        reporter: "spec"

  # Load tasks from plugins
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-bumpx"
  grunt.loadNpmTasks "grunt-mocha-test"

  # Task to tag a version in git
  grunt.registerTask "git-tag", "Tags a release in git", ->
    exec = require("child_process").exec
    done = this.async()
    releaseVersion = grunt.template.process("<%= pkg.version %>")

    child = exec "git commit -am \"v#{releaseVersion}\" ; git tag v#{releaseVersion} && git push --tags origin master", (error, stdout, stderr) ->
      console.log("Error running git tag: " + error) if error?
      done(!error?)

  # Release meta-task
  grunt.registerTask "release", ["coffee", "git-tag"]

  # Default meta-task
  grunt.registerTask "default", ["coffee", "mochaTest"]
