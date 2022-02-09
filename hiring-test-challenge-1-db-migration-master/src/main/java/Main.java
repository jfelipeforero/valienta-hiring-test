import io.github.cdimascio.dotenv.Dotenv;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Main {
    private static final Logger LOGGER = Logger.getLogger(Main.class.getName());
    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    private static final String CHANGELOG_PATH = "changelog.xml";
    private static final int CONNECTION_MAX_ATTEMPTS = 5000;
    private static final long CONNECTION_BACKOFF_MILLIS = 1000;

    public static void main(String[] args) throws SQLException {
        LOGGER.log(Level.INFO, "Initializing migrations");

        Connection connection = null;

        try {
            connection = openConnection();

            LOGGER.log(Level.INFO, "Successfully connected to database");

            final Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));

            LOGGER.log(Level.INFO, "Starting migrations");

            final Liquibase liquibase = new Liquibase(CHANGELOG_PATH, new ClassLoaderResourceAccessor(), database);

            liquibase.update(new Contexts(), new LabelExpression());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error while trying to perform migration.");
            LOGGER.log(Level.SEVERE, e.toString(), e);

            if (connection != null) {
                connection.rollback();
                connection.close();
            }
        }

    }

    private static Connection openConnection() throws SQLException, InterruptedException {
        final String databaseDNS = dotenv.get("DATABASE_DNS", "localhost");
        final String databasePort = dotenv.get("DATABASE_PORT", "5432");
        final String databaseName = dotenv.get("DATABASE_NAME", "postgres");
        final String connectionUrl = String.format("jdbc:postgresql://%s:%s/%s", databaseDNS, databasePort, databaseName);

        final String databaseUser = dotenv.get("DATABASE_USER", "postgres");
        final String databasePassword = dotenv.get("DATABASE_PASSWORD", "");
        final String isSSLEnabled = dotenv.get("DATABASE_USE_SSL", "");

        Properties properties = new Properties();
        properties.setProperty("user", databaseUser);
        properties.setProperty("password", databasePassword);

        if (isSSLEnabled.equalsIgnoreCase("true")) {
            properties.setProperty("ssl", isSSLEnabled);
        }

        LOGGER.log(Level.INFO, String.format("Trying to connect to %s", connectionUrl));

        Connection connection = null;
        int connectionAttemptNumber = 1;
        SQLException resultingException = null;

        while (connection == null && connectionAttemptNumber <= CONNECTION_MAX_ATTEMPTS) {
            try {
                connection = DriverManager.getConnection(connectionUrl, properties);
            } catch (SQLException e) {
                LOGGER.log(Level.WARNING, String.format("Connection attempt %d failed, retrying", connectionAttemptNumber));

                connectionAttemptNumber++;
                resultingException = e;

                Thread.sleep(CONNECTION_BACKOFF_MILLIS);
            }
        }

        if (resultingException != null) {
            throw resultingException;
        }

        return connection;
    }
}
