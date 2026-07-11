pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    environment {
        DOCKER_NETWORK_NAME = 'database-common-network'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate deployment') {
            steps {
                sh 'docker compose config --quiet'
            }
        }

        stage('Ensure Docker network') {
            steps {
                sh 'docker network inspect "$DOCKER_NETWORK_NAME" >/dev/null 2>&1 || docker network create "$DOCKER_NETWORK_NAME"'
            }
        }

        stage('Build image') {
            steps {
                sh 'docker compose build scra-atlas'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d --force-recreate --remove-orphans'
            }
        }

        stage('Status') {
            steps {
                sh 'docker compose ps'
                sh 'docker compose ps --status running --services | grep -Fx scra-atlas'
            }
        }
    }

    post {
        failure {
            sh 'docker compose ps || true'
            sh 'docker compose logs --tail=100 || true'
        }
    }
}
