package za.co.api.gateway.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final RequestMappingHandlerMapping handlerMapping;

    @Autowired
    public DebugController(@Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @GetMapping("/mappings")
    public List<Map<String, Object>> getCustomMappings() {
        return handlerMapping.getHandlerMethods().entrySet().stream()
                .filter(entry -> entry
                        .getValue()
                        .getBeanType()
                        .getPackageName()
                        .startsWith("za.co.api.gateway.controller"))
                .map(entry -> {
                    RequestMappingInfo mappingInfo = entry.getKey();
                    HandlerMethod method = entry.getValue();

                    Map<String, Object> mappingData = new LinkedHashMap<>();
                    mappingData.put("path", mappingInfo.getPatternValues());
                    mappingData.put("httpMethods", mappingInfo.getMethodsCondition().getMethods());
                    mappingData.put("controller", method.getBeanType().getSimpleName());
                    mappingData.put("method", method.getMethod().getName());
                    mappingData.put("returnType", method.getMethod().getReturnType().getSimpleName());

                    List<Map<String, String>> params = Arrays.stream(method.getMethod().getParameters())
                            .map(param -> Map.of(
                                    "name", param.getName(),
                                    "type", param.getType().getSimpleName()
                            )).collect(Collectors.toList());

                    mappingData.put("parameters", params);

                    return mappingData;
                })
                .sorted(Comparator.comparing(m -> m.get("path").toString()))
                .collect(Collectors.toList());
    }
}
