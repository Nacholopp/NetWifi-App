package backend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
class BackendApplicationTests {

    @Test
    void applicationClassLoads() {
        BackendApplication app = new BackendApplication();
        assertNotNull(app);
    }
}
