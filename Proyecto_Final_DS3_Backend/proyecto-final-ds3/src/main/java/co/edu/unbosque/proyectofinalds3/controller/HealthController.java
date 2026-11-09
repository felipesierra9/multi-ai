package co.edu.unbosque.proyectofinalds3.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint de diagnóstico: confirma que la API está viva y que
 * la conexión con MySQL funciona. Se elimina o protege más adelante.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, String> health() {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("api", "UP");
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("database", "UP");
        } catch (Exception e) {
            response.put("database", "DOWN");
        }
        return response;
    }
}