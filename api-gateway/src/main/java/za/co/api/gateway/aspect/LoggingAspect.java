package za.co.api.gateway.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    // Log all methods inside service package
    @Pointcut("execution(* za.co.api.gateway.service..*(..))")
    public void serviceMethods() {}

//    @Pointcut("execution(* za.co.api.gateway.util..*(..))")
//    public void utilMethods() {}

    @Pointcut("execution(* za.co.api.gateway.controller..*(..))")
    public void controllerMethods() {}

    // Combine all
    @Pointcut("serviceMethods() || utilMethods() || controllerMethods()")
    public void applicationLayer() {}


    // Logging
    @Before("applicationLayer()")
    public void logBefore(JoinPoint joinPoint) {
        logger.info("Entering: {} with args: {}", joinPoint.getSignature(), joinPoint.getArgs());
    }

    @AfterReturning(pointcut = "applicationLayer()", returning = "result")
    public void logAfter(JoinPoint joinPoint, Object result) {
        logger.info("Exiting: {} with result: {}", joinPoint.getSignature(), result);
    }

    @AfterThrowing(pointcut = "applicationLayer()", throwing = "ex")
    public void logException(JoinPoint joinPoint, Throwable ex) {
        logger.error("Exception in {}: {}", joinPoint.getSignature(), ex.getMessage(), ex);
    }

    @Around("applicationLayer()")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - start;
        logger.info("{} executed in {} ms", joinPoint.getSignature(), duration);
        return result;
    }
}
