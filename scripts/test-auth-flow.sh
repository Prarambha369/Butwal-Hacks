#!/bin/bash
grep -rn "useUser\|Auth0Provider" src/components/ --include="*.tsx" | grep -v node_modules | grep -v "layout.tsx"
