package com.ecommerce.user.service;

import com.ecommerce.user.config.JwtUtil;
import com.ecommerce.user.dto.UserDTO;
import com.ecommerce.user.entity.User;
import com.ecommerce.user.exception.DuplicateResourceException;
import com.ecommerce.user.exception.InvalidRequestException;
import com.ecommerce.user.exception.ResourceNotFoundException;
import com.ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtUtil jwtUtil;
    private UserService userService;

    private User testUser;
    private UserDTO.RegisterRequest registerRequest;
    private UserDTO.LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        // Create real JwtUtil with test configuration (avoids Java 24 Mockito restrictions)
        jwtUtil = new JwtUtil();
        try {
            var secretField = JwtUtil.class.getDeclaredField("jwtSecret");
            secretField.setAccessible(true);
            secretField.set(jwtUtil, "dGVzdC1zZWNyZXQta2V5LWZvci1qd3QtdG9rZW4tZ2VuZXJhdGlvbi11c2UtYS12ZXJ5LWxvbmctc2VjdXJlLXN0cmluZw==");
            var expField = JwtUtil.class.getDeclaredField("jwtExpiration");
            expField.setAccessible(true);
            expField.set(jwtUtil, 86400000L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // Construct service manually with real JwtUtil
        userService = new UserService(userRepository, passwordEncoder, jwtUtil);

        testUser = new User("John", "Doe", "john@example.com", "encodedPassword", "1234567890", User.Role.CUSTOMER);
        testUser.setId(1L);

        registerRequest = new UserDTO.RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPhone("1234567890");
        registerRequest.setPassword("password123");

        loginRequest = new UserDTO.LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password123");
    }

    // ===== REGISTRATION TESTS =====

    @Test
    @DisplayName("Register - Success")
    void register_Success() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDTO.AuthResponse response = userService.register(registerRequest);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("John", response.getFirstName());
        assertEquals("CUSTOMER", response.getRole());

        verify(userRepository).existsByEmail("john@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register - Duplicate Email Throws Exception")
    void register_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> userService.register(registerRequest)
        );

        assertEquals("Email already registered", exception.getMessage());
        assertEquals("DUPLICATE_EMAIL", exception.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    // ===== LOGIN TESTS =====

    @Test
    @DisplayName("Login - Success")
    void login_Success() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        UserDTO.AuthResponse response = userService.login(loginRequest);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("john@example.com", response.getEmail());
    }

    @Test
    @DisplayName("Login - Invalid Email Throws Exception")
    void login_InvalidEmail_ThrowsException() {
        when(userRepository.findByEmail("wrong@example.com")).thenReturn(Optional.empty());

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> {
                    UserDTO.LoginRequest badRequest = new UserDTO.LoginRequest();
                    badRequest.setEmail("wrong@example.com");
                    badRequest.setPassword("password");
                    userService.login(badRequest);
                }
        );

        assertEquals("Invalid email or password", exception.getMessage());
        assertEquals("INVALID_CREDENTIALS", exception.getErrorCode());
    }

    @Test
    @DisplayName("Login - Invalid Password Throws Exception")
    void login_InvalidPassword_ThrowsException() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> {
                    UserDTO.LoginRequest badRequest = new UserDTO.LoginRequest();
                    badRequest.setEmail("john@example.com");
                    badRequest.setPassword("wrongpassword");
                    userService.login(badRequest);
                }
        );

        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    @DisplayName("Login - Inactive Account Throws Exception")
    void login_InactiveAccount_ThrowsException() {
        testUser.setStatus(User.UserStatus.SUSPENDED);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> userService.login(loginRequest)
        );

        assertEquals("Account is not active", exception.getMessage());
        assertEquals("ACCOUNT_INACTIVE", exception.getErrorCode());
    }

    // ===== GET USER TESTS =====

    @Test
    @DisplayName("Get User By ID - Success")
    void getUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserDTO result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals("John", result.getFirstName());
        assertEquals("Doe", result.getLastName());
        assertEquals("john@example.com", result.getEmail());
        assertEquals("CUSTOMER", result.getRole());
    }

    @Test
    @DisplayName("Get User By ID - Not Found Throws Exception")
    void getUserById_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.getUserById(99L)
        );

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    @DisplayName("Get User By Email - Success")
    void getUserByEmail_Success() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));

        UserDTO result = userService.getUserByEmail("john@example.com");

        assertNotNull(result);
        assertEquals("john@example.com", result.getEmail());
    }

    @Test
    @DisplayName("Get User By Email - Not Found Throws Exception")
    void getUserByEmail_NotFound_ThrowsException() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.getUserByEmail("missing@example.com"));
    }

    // ===== UPDATE USER TESTS =====

    @Test
    @DisplayName("Update User - Success")
    void updateUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO.UpdateRequest updateRequest = new UserDTO.UpdateRequest();
        updateRequest.setFirstName("Jane");
        updateRequest.setPhone("9876543210");

        UserDTO result = userService.updateUser(1L, updateRequest);

        assertNotNull(result);
        assertEquals("Jane", result.getFirstName());
        assertEquals("9876543210", result.getPhone());

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Update User - Not Found Throws Exception")
    void updateUser_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        UserDTO.UpdateRequest updateRequest = new UserDTO.UpdateRequest();
        updateRequest.setFirstName("Jane");

        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateUser(99L, updateRequest));
    }

    @Test
    @DisplayName("Update User - Partial Update Only Fields")
    void updateUser_PartialUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO.UpdateRequest updateRequest = new UserDTO.UpdateRequest();
        updateRequest.setLastName("Smith");

        UserDTO result = userService.updateUser(1L, updateRequest);

        assertEquals("John", result.getFirstName()); // unchanged
        assertEquals("Smith", result.getLastName()); // updated
        assertEquals("1234567890", result.getPhone()); // unchanged
    }
}
