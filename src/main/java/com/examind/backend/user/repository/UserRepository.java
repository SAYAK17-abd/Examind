package com.examind.backend.user.repository;

import com.examind.backend.user.entity.RoleName;
import com.examind.backend.user.entity.User;
import com.examind.backend.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<User> findByRole_Name(RoleName roleName, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    long countByRole_Name(RoleName roleName);
}
