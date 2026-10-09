FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
COPY pom.xml .
COPY admin-service/pom.xml admin-service/
RUN cd admin-service && mvn dependency:go-offline -B
COPY admin-service/src admin-service/src
RUN cd admin-service && mvn package -DskipTests -B
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/admin-service/target/*.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]
