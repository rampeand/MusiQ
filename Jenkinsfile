pipeline {
    
    environment {
        registry = "rampeand/MusiQ"
        registryCredential = 'dockerhub'
    }

    agent none
    
    stages {

        stage('Stop containers') {
            
            agent {
                label 'master'
            }

            steps {
                script{
                    try{
                        sh 'docker stop musiq'
                    }catch (err) {

                    }
                    try{
                        sh 'docker rm musiq'
                    }catch (err) {

                    }
                    try{
                        sh 'docker rmi musiq_image'
                    }catch (err) {

                    }
                }
            }
        }

        stage('Create container and run tests') {
            
            agent {
                docker {
                    image 'node:10-alpine'
                    args '-p 82:8080'
                }
            }
    
            steps {
                checkout scm
                sh 'npm install mocha'
                sh 'npm test'
            }

            post {
                always {
                    junit allowEmptyResults: true, keepLongStdio: true, testResults: 'test-report.xml'
                }
            }
        }

        stage('SCM checkout') {
             agent {
                 label 'master'
             }
             steps {   
                checkout scm
            }
        }

        stage('Build image & deploy container'){
            
            agent{
                label 'master'
            }

            steps{
                sh 'docker build -t musiq_image .'
                sh 'docker run --name musiq -d -p 82:8080 musiq_image'
            }
        }
        
        stage('Building image for registry') {
            steps{
                script {
                    dockerImage = docker.build registry + ":$BUILD_NUMBER"
                }
            }
        }

        stage('Deploying image to registry') {
            steps{
                script {
                    docker.withRegistry( '', registryCredential ) {
                        dockerImage.push()
                        dockerImage.push('latest')
                    }
                }
            }
        }

        stage('Remove unused docker image') {
        
            agent {
                 label 'master'
             }
        
            steps{
                sh "docker rmi $registry:$BUILD_NUMBER"
                sh 'docker system prune --all --force'
            }
        }        
    }
}