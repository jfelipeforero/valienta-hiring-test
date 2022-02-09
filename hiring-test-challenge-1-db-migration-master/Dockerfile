FROM maven:3.6.3-jdk-13 as BUILD

WORKDIR /usr/src/app
COPY . .

RUN mvn package

FROM maven:3.6.3-jdk-13 as TEST

RUN echo "No unit tests to run"

# production image
FROM openjdk:13.0.2-jdk as PROD

WORKDIR /usr/src/app

COPY --from=BUILD /usr/src/app/target/app-jar-with-dependencies.jar app/app.jar

CMD ["java", "-jar", "app/app.jar"]
