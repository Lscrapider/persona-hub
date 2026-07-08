pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    APP_NAME = 'scra-atlas'
    CONTAINER_NAME = 'scra-atlas'
    HOST_PORT = '5778'
    CONTAINER_PORT = '5778'
    DEPLOY_IMAGE = "scra-atlas:${BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Image') {
      steps {
        sh '''
          set -eu
          docker build -t "$DEPLOY_IMAGE" .
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -eu
          docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
          docker run -d \
            --name "$CONTAINER_NAME" \
            --restart unless-stopped \
            -p "$HOST_PORT:$CONTAINER_PORT" \
            "$DEPLOY_IMAGE"
        '''
      }
    }

    stage('Status') {
      steps {
        sh '''
          docker ps --filter "name=$CONTAINER_NAME"
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed ${APP_NAME} at http://localhost:${HOST_PORT}"
    }
  }
}
